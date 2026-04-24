import type { TFunction } from "i18next";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { type MetaFunction, useNavigate, useOutletContext } from "react-router";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import { InputField } from "~/components/inputs/InputField";
import { TextArea } from "~/components/inputs/TextArea";
import type {
	CategoryMap,
	CategoryTypeCode,
} from "~/components/recipe/RecipeCategorySection";
import {
	CATEGORY_TYPE_CODES,
	RecipeCategorySection,
} from "~/components/recipe/RecipeCategorySection";
import { RecipeFormField } from "~/components/recipe/RecipeFormField";
import { RecipeFormFieldset } from "~/components/recipe/RecipeFormFieldset";
import type {
	IngredientOption,
	IngredientRow,
	UnitOption,
} from "~/components/recipe/RecipeIngredientRow";
import { RecipeIngredientSection } from "~/components/recipe/RecipeIngredientSection";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import { RecipeInstructionSection } from "~/components/recipe/RecipeInstructionSection";
import { RecipePhotoUpload } from "~/components/recipe/RecipePhotoUpload";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import type { LayoutOutletContext } from "~/layouts/layout";
import "../assets/styles/recipe-create.css";

export const meta: MetaFunction = () => [
	{ title: "Add a recipe — Transcendence" },
];

const DESCRIPTION_MAX = 128;

type NumOrEmpty = number | "";

const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

const buildRecipeFormSchema = (t: TFunction) => {
	const v = (key: string, opts?: Record<string, unknown>) =>
		t(`recipeCreateValidation.${key}`, opts);

	const servingsSchema = z.preprocess(
		emptyToUndef,
		z
			.number({ error: v("servingsRequired") })
			.int(v("servingsInt"))
			.positive(v("servingsPositive")),
	);

	const hoursSchema = (requiredKey: string) =>
		z.preprocess(
			emptyToUndef,
			z
				.number({ error: v(requiredKey) })
				.int(v("hoursInt"))
				.nonnegative(v("hoursNonneg")),
		);

	const minutesSchema = (requiredKey: string) =>
		z.preprocess(
			emptyToUndef,
			z
				.number({ error: v(requiredKey) })
				.int(v("minutesInt"))
				.min(0, v("minutesRange"))
				.max(59, v("minutesRange")),
		);

	const spicinessSchema = z.preprocess(
		emptyToUndef,
		z
			.number({ error: v("spicinessRequired") })
			.int(v("spicinessInt"))
			.min(0, v("spicinessRange"))
			.max(3, v("spicinessRange")),
	);

	const amountSchema = z.preprocess(
		emptyToUndef,
		z.number({ error: v("amountRequired") }).positive(v("amountPositive")),
	);

	const ingredientIdSchema = z
		.number({ error: v("ingredientRequired") })
		.int()
		.positive(v("ingredientRequired"));

	return z
		.object({
			title: z.string().min(1, v("titleRequired")),
			description: z
				.string()
				.min(1, v("descriptionRequired"))
				.max(DESCRIPTION_MAX, v("descriptionMax", { count: DESCRIPTION_MAX })),
			servings: servingsSchema,
			spiciness: spicinessSchema,
			prepHours: hoursSchema("prepHoursRequired"),
			prepMinutes: minutesSchema("prepMinutesRequired"),
			cookHours: hoursSchema("cookHoursRequired"),
			cookMinutes: minutesSchema("cookMinutesRequired"),
			ingredients: z
				.array(
					z.object({
						ingredientId: ingredientIdSchema,
						amount: amountSchema,
						unit: z.string().min(1, v("unitRequired")),
					}),
				)
				.min(1, v("ingredientsMin"))
				.refine(
					(items) =>
						new Set(items.map((item) => item.ingredientId)).size ===
						items.length,
					v("ingredientsUnique"),
				),
			instructions: z
				.array(z.object({ text: z.string().min(1, v("stepRequired")) }))
				.min(1, v("instructionsMin")),
			categoryIds: z.array(z.number().int().positive()),
		})
		.refine((d) => d.prepHours * 60 + d.prepMinutes >= 0, {
			message: v("prepTimeNonneg"),
			path: ["prepHours"],
		})
		.refine((d) => d.cookHours * 60 + d.cookMinutes > 0, {
			message: v("cookTimePositive"),
			path: ["cookHours"],
		});
};

type RecipeFormValues = z.infer<ReturnType<typeof buildRecipeFormSchema>>;

const IngredientsResponseSchema = z.object({
	ingredients: z.array(
		z.object({
			id: z.number().int().positive(),
			name: z.string(),
		}),
	),
});

const UnitsResponseSchema = z.object({
	units: z.array(
		z.object({
			code: z.string().min(1),
			kind: z.string().min(1),
		}),
	),
});

const CategoryListItemSchema = z.object({
	id: z.number().int().positive(),
	code: z.string(),
	name: z.string(),
});

const makeCategoryResponseSchema = (typeCode: CategoryTypeCode) =>
	z.object({
		[typeCode]: z.array(CategoryListItemSchema),
	});

type FormState = {
	title: string;
	description: string;
	servings: NumOrEmpty;
	spiciness: NumOrEmpty;
	prepHours: NumOrEmpty;
	prepMinutes: NumOrEmpty;
	cookHours: NumOrEmpty;
	cookMinutes: NumOrEmpty;
};

type NumericField =
	| "servings"
	| "spiciness"
	| "prepHours"
	| "prepMinutes"
	| "cookHours"
	| "cookMinutes";

const initialForm: FormState = {
	title: "",
	description: "",
	servings: "",
	spiciness: "",
	prepHours: "",
	prepMinutes: "",
	cookHours: "",
	cookMinutes: "",
};

const emptyCategoryMap = (): CategoryMap => ({
	meal_time: [],
	dish_type: [],
	main_ingredient: [],
	cuisine: [],
});

type CreateRecipeResponse = {
	data?: { id: number };
};

const RecipeCreate = () => {
	const baseId = useId();
	const { t, i18n } = useTranslation();
	useDocumentTitle(t("pageTitles.recipeCreate"));
	const language = i18n.resolvedLanguage ?? "en";
	const navigate = useNavigate();
	const { isAuthenticated, isAuthResolved, openAuthModal } =
		useOutletContext<LayoutOutletContext>();
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [photoFile, setPhotoFile] = useState<File | null>(null);
	const [form, setForm] = useState<FormState>(initialForm);
	const [ingredients, setIngredients] = useState<IngredientRow[]>(() => [
		{ id: `${baseId}-i0`, ingredientId: null, amount: "", unit: "" },
	]);
	const [instructions, setInstructions] = useState<InstructionRow[]>(() => [
		{ id: `${baseId}-s0`, text: "" },
	]);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [ingredientOptions, setIngredientOptions] = useState<
		IngredientOption[]
	>([]);
	const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
	const [categories, setCategories] = useState<CategoryMap>(() =>
		emptyCategoryMap(),
	);
	const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(
		() => new Set<number>(),
	);
	const authGateHandledRef = useRef(false);

	useEffect(() => {
		if (!photoPreview) {
			return;
		}
		return () => {
			URL.revokeObjectURL(photoPreview);
		};
	}, [photoPreview]);

	useEffect(() => {
		if (!isAuthResolved) {
			return;
		}
		if (isAuthenticated) {
			authGateHandledRef.current = false;
			return;
		}
		if (authGateHandledRef.current) {
			return;
		}
		authGateHandledRef.current = true;
		openAuthModal(
			() => {},
			() => {
				navigate("/recipes");
			},
		);
	}, [isAuthResolved, isAuthenticated, openAuthModal, navigate]);

	useEffect(() => {
		let cancelled = false;

		const fetchIngredients = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/recipes/ingredients`);
				if (!response.ok) {
					console.error(`Failed to fetch ingredients: ${response.status}`);
					return;
				}
				const body: unknown = await response.json();
				const parsed = IngredientsResponseSchema.safeParse(body);
				if (!parsed.success) {
					console.error("Unexpected ingredients response", parsed.error);
					return;
				}
				if (!cancelled) {
					setIngredientOptions(parsed.data.ingredients);
				}
			} catch (error) {
				console.error(error);
			}
		};

		const fetchUnits = async () => {
			try {
				const response = await fetch(`${API_BASE_URL}/recipes/units`);
				if (!response.ok) {
					console.error(`Failed to fetch units: ${response.status}`);
					return;
				}
				const body: unknown = await response.json();
				const parsed = UnitsResponseSchema.safeParse(body);
				if (!parsed.success) {
					console.error("Unexpected units response", parsed.error);
					return;
				}
				if (!cancelled) {
					setUnitOptions(parsed.data.units);
				}
			} catch (error) {
				console.error(error);
			}
		};

		const fetchCategoryType = async (typeCode: CategoryTypeCode) => {
			try {
				const response = await fetch(`${API_BASE_URL}/recipes/${typeCode}`);
				if (!response.ok) {
					console.error(
						`Failed to fetch categories ${typeCode}: ${response.status}`,
					);
					return;
				}
				const body: unknown = await response.json();
				const parsed = makeCategoryResponseSchema(typeCode).safeParse(body);
				if (!parsed.success) {
					console.error(
						`Unexpected categories response for ${typeCode}`,
						parsed.error,
					);
					return;
				}
				const items = parsed.data[typeCode] ?? [];
				if (!cancelled) {
					setCategories((prev) => ({ ...prev, [typeCode]: items }));
				}
			} catch (error) {
				console.error(error);
			}
		};

		void fetchIngredients();
		void fetchUnits();
		for (const typeCode of CATEGORY_TYPE_CODES) {
			void fetchCategoryType(typeCode);
		}

		return () => {
			cancelled = true;
		};
	}, []);

	const handleCategoryTypeChange = useCallback(
		(typeCode: CategoryTypeCode, ids: number[]) => {
			const typeOptionIds = new Set(
				(categories[typeCode] ?? []).map((option) => option.id),
			);
			setSelectedCategoryIds((prev) => {
				const next = new Set<number>();
				for (const id of prev) {
					if (!typeOptionIds.has(id)) {
						next.add(id);
					}
				}
				for (const id of ids) {
					next.add(id);
				}
				return next;
			});
		},
		[categories],
	);

	const categoryIdsArray = useMemo(
		() => Array.from(selectedCategoryIds),
		[selectedCategoryIds],
	);

	const setText =
		(field: "title" | "description") =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setForm((prev) => ({ ...prev, [field]: e.target.value }));
		};

	const setNumber =
		(field: NumericField) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const v = e.target.valueAsNumber;
			setForm((prev) => ({
				...prev,
				[field]: Number.isNaN(v) ? "" : v,
			}));
		};

	const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		setPhotoFile(file);
		setPhotoPreview(URL.createObjectURL(file));
	};

	const uploadPicture = async (
		recipeId: number,
		file: File,
	): Promise<boolean> => {
		try {
			const response = await fetch(
				`${API_BASE_URL}/recipes/${recipeId}/picture`,
				{
					method: "PUT",
					credentials: "include",
					body: (() => {
						const formData = new FormData();
						formData.append("picture", file);
						return formData;
					})(),
				},
			);
			if (!response.ok) {
				console.error(`Failed to upload recipe picture: ${response.status}`);
				return false;
			}
			return true;
		} catch (error) {
			console.error(error);
			return false;
		}
	};

	const submitRecipe = async (parsed: RecipeFormValues): Promise<void> => {
		setIsSubmitting(true);
		setFormError(null);

		const payload = {
			title: parsed.title,
			description: parsed.description,
			servings: parsed.servings,
			spiciness: parsed.spiciness,
			instructions: parsed.instructions.map((step) => step.text),
			ingredients: parsed.ingredients.map((ingredient) => ({
				ingredient_id: ingredient.ingredientId,
				amount: ingredient.amount,
				unit: ingredient.unit,
			})),
			category_ids: parsed.categoryIds,
		};

		try {
			const response = await fetch(`${API_BASE_URL}/recipes`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"X-Language": language,
					"X-Source-Language": language,
				},
				body: JSON.stringify(payload),
			});

			if (response.status === 401) {
				openAuthModal(
					() => {
						void submitRecipe(parsed);
					},
					() => {
						navigate("/recipes");
					},
				);
				return;
			}

			if (!response.ok) {
				setFormError(
					t("recipeCreatePage.createError", { status: response.status }),
				);
				return;
			}

			const body: CreateRecipeResponse = await response.json();
			const newId = body.data?.id;
			if (typeof newId === "number") {
				let pictureUploadFailed = false;
				if (photoFile) {
					const ok = await uploadPicture(newId, photoFile);
					pictureUploadFailed = !ok;
				}
				navigate(`/recipes/${newId}`, {
					state: pictureUploadFailed
						? { pictureUploadFailed: true }
						: undefined,
				});
				return;
			}
			navigate("/recipes");
		} catch (error) {
			console.error(error);
			setFormError(t("recipeCreatePage.networkError"));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);

		const schema = buildRecipeFormSchema(t);
		const parsed = schema.safeParse({
			...form,
			ingredients,
			instructions,
			categoryIds: categoryIdsArray,
		});

		if (!parsed.success) {
			setFormError(
				parsed.error.issues[0]?.message ?? t("recipeCreatePage.genericError"),
			);
			return;
		}

		void submitRecipe(parsed.data);
	};

	return (
		<section
			className="recipe-create-page"
			aria-labelledby="recipe-create-heading"
		>
			<header className="recipe-create-header">
				<h1 id="recipe-create-heading">{t("recipeCreatePage.title")}</h1>
				<p id="recipe-create-subtitle" className="text-caption">
					{t("recipeCreatePage.subtitle")}
				</p>
			</header>

			<form
				className="recipe-create-form"
				onSubmit={handleSubmit}
				noValidate
				autoComplete="off"
				aria-labelledby="recipe-create-heading"
				aria-describedby="recipe-create-subtitle"
				aria-busy={isSubmitting}
			>
				<RecipePhotoUpload
					photoPreview={photoPreview}
					onChange={handlePhotoChange}
				/>

				<RecipeFormField
					label={t("recipeCreatePage.recipeTitleLabel")}
					htmlFor="recipe-title"
					required
				>
					<InputField
						id="recipe-title"
						placeholder={t("recipeCreatePage.recipeTitlePlaceholder")}
						floatingLabel={false}
						required
						value={form.title}
						onChange={setText("title")}
					/>
				</RecipeFormField>

				<RecipeFormField
					label={t("recipeCreatePage.descriptionLabel")}
					htmlFor="recipe-description"
					required
				>
					<TextArea
						id="recipe-description"
						className="recipe-description-textarea text-body3"
						placeholder={t("recipeCreatePage.descriptionPlaceholder")}
						value={form.description}
						onChange={(value) =>
							setForm((prev) => ({ ...prev, description: value }))
						}
						maxLength={DESCRIPTION_MAX}
						required
						describedBy="recipe-description-counter"
						footer={
							<p
								id="recipe-description-counter"
								className="recipe-description-counter text-caption-s"
								aria-live="polite"
							>
								{form.description.length} / {DESCRIPTION_MAX}
							</p>
						}
					/>
				</RecipeFormField>

				<RecipeFormField
					label={t("recipeCreatePage.servingsLabel")}
					htmlFor="recipe-servings"
					required
				>
					<InputField
						id="recipe-servings"
						type="number"
						placeholder={t("recipeCreatePage.servingsPlaceholder")}
						floatingLabel={false}
						min={1}
						required
						value={form.servings}
						onChange={setNumber("servings")}
					/>
				</RecipeFormField>

				<RecipeFormField
					label={t("recipeCreatePage.spicinessLabel")}
					htmlFor="recipe-spiciness"
					required
				>
					<InputField
						id="recipe-spiciness"
						type="number"
						placeholder={t("recipeCreatePage.spicinessPlaceholder")}
						floatingLabel={false}
						min={0}
						max={3}
						required
						value={form.spiciness}
						onChange={setNumber("spiciness")}
					/>
				</RecipeFormField>

				<RecipeFormFieldset
					legend={t("recipeCreatePage.prepTimeLegend")}
					required
				>
					<div className="recipe-create-time-row">
						<InputField
							id="prep-hours"
							type="number"
							placeholder={t("recipeCreatePage.hoursPlaceholder")}
							min={0}
							required
							value={form.prepHours}
							onChange={setNumber("prepHours")}
							aria-label={t("recipeCreateAria.prepHours")}
						/>
						<InputField
							id="prep-minutes"
							type="number"
							placeholder={t("recipeCreatePage.minutesPlaceholder")}
							min={0}
							max={59}
							required
							value={form.prepMinutes}
							onChange={setNumber("prepMinutes")}
							aria-label={t("recipeCreateAria.prepMinutes")}
						/>
					</div>
				</RecipeFormFieldset>

				<RecipeFormFieldset
					legend={t("recipeCreatePage.cookTimeLegend")}
					required
				>
					<div className="recipe-create-time-row">
						<InputField
							id="cook-hours"
							type="number"
							placeholder={t("recipeCreatePage.hoursPlaceholder")}
							min={0}
							required
							value={form.cookHours}
							onChange={setNumber("cookHours")}
							aria-label={t("recipeCreateAria.cookHours")}
						/>
						<InputField
							id="cook-minutes"
							type="number"
							placeholder={t("recipeCreatePage.minutesPlaceholder")}
							min={0}
							max={59}
							required
							value={form.cookMinutes}
							onChange={setNumber("cookMinutes")}
							aria-label={t("recipeCreateAria.cookMinutes")}
						/>
					</div>
				</RecipeFormFieldset>

				<RecipeCategorySection
					categories={categories}
					selectedIds={selectedCategoryIds}
					onTypeChange={handleCategoryTypeChange}
				/>

				<RecipeIngredientSection
					rows={ingredients}
					ingredientOptions={ingredientOptions}
					unitOptions={unitOptions}
					onChange={setIngredients}
				/>

				<RecipeInstructionSection
					rows={instructions}
					onChange={setInstructions}
				/>

				{formError ? (
					<p
						key={formError}
						className="recipe-create-error text-caption-s"
						role="alert"
					>
						{formError}
					</p>
				) : null}

				<MainButton
					type="submit"
					className="recipe-create-submit"
					disabled={isSubmitting}
				>
					{isSubmitting
						? t("recipeCreatePage.submittingButton")
						: t("recipeCreatePage.submitButton")}
				</MainButton>
			</form>
		</section>
	);
};

export default RecipeCreate;
