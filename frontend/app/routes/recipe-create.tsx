import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext } from "react-router";
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
} from "~/components/recipe/RecipeIngredientRow";
import { RecipeIngredientSection } from "~/components/recipe/RecipeIngredientSection";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import { RecipeInstructionSection } from "~/components/recipe/RecipeInstructionSection";
import { RecipePhotoUpload } from "~/components/recipe/RecipePhotoUpload";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import type { LayoutOutletContext } from "~/layouts/layout";
import "../assets/styles/recipe-create.css";

const DESCRIPTION_MAX = 128;

type NumOrEmpty = number | "";

const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

const servingsSchema = z.preprocess(
	emptyToUndef,
	z
		.number({ error: "Servings is required" })
		.int("Servings must be a whole number")
		.positive("Servings must be a positive integer"),
);

const hoursSchema = (field: string) =>
	z.preprocess(
		emptyToUndef,
		z
			.number({ error: `${field} is required` })
			.int("Hours must be a whole number")
			.nonnegative("Hours must be 0 or more"),
	);

const minutesSchema = (field: string) =>
	z.preprocess(
		emptyToUndef,
		z
			.number({ error: `${field} is required` })
			.int("Minutes must be a whole number")
			.min(0, "Minutes must be 0–59")
			.max(59, "Minutes must be 0–59"),
	);

const spicinessSchema = z.preprocess(
	emptyToUndef,
	z
		.number({ error: "Spiciness is required" })
		.int("Spiciness must be a whole number")
		.min(0, "Spiciness must be 0–3")
		.max(3, "Spiciness must be 0–3"),
);

const amountSchema = z.preprocess(
	emptyToUndef,
	z
		.number({ error: "Ingredient amount is required" })
		.positive("Ingredient amount must be positive"),
);

const ingredientIdSchema = z
	.number({ error: "Ingredient is required" })
	.int()
	.positive("Ingredient is required");

const RecipeFormSchema = z
	.object({
		title: z.string().min(1, "Recipe title is required"),
		description: z
			.string()
			.min(1, "Description is required")
			.max(
				DESCRIPTION_MAX,
				`Description must be at most ${DESCRIPTION_MAX} characters`,
			),
		servings: servingsSchema,
		spiciness: spicinessSchema,
		prepHours: hoursSchema("Prep hours"),
		prepMinutes: minutesSchema("Prep minutes"),
		cookHours: hoursSchema("Cook hours"),
		cookMinutes: minutesSchema("Cook minutes"),
		ingredients: z
			.array(
				z.object({
					ingredientId: ingredientIdSchema,
					amount: amountSchema,
					unit: z.string().min(1, "Ingredient unit is required"),
				}),
			)
			.min(1, "At least one ingredient is required")
			.refine(
				(items) =>
					new Set(items.map((item) => item.ingredientId)).size === items.length,
				"Ingredients must be unique",
			),
		instructions: z
			.array(z.object({ text: z.string().min(1, "Step text is required") }))
			.min(1, "At least one instruction step is required"),
		categoryIds: z.array(z.number().int().positive()),
	})
	.refine((d) => d.prepHours * 60 + d.prepMinutes > 0, {
		message: "Prep time must be greater than 0",
		path: ["prepHours"],
	})
	.refine((d) => d.cookHours * 60 + d.cookMinutes > 0, {
		message: "Cook time must be greater than 0",
		path: ["cookHours"],
	});

const IngredientsResponseSchema = z.object({
	ingredients: z.array(
		z.object({
			id: z.number().int().positive(),
			name: z.string(),
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
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { isAuthenticated, isAuthResolved, openAuthModal } =
		useOutletContext<LayoutOutletContext>();
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [form, setForm] = useState<FormState>(initialForm);
	const [ingredients, setIngredients] = useState<IngredientRow[]>(() => [
		{ id: `${baseId}-i0`, ingredientId: null, amount: "", unit: "g" },
	]);
	const [instructions, setInstructions] = useState<InstructionRow[]>(() => [
		{ id: `${baseId}-s0`, text: "" },
	]);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [ingredientOptions, setIngredientOptions] = useState<
		IngredientOption[]
	>([]);
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
		setPhotoPreview(URL.createObjectURL(file));
	};

	const submitRecipe = async (
		parsed: z.infer<typeof RecipeFormSchema>,
	): Promise<void> => {
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
				headers: { "Content-Type": "application/json" },
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
				navigate(`/recipes/${newId}`);
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

		const parsed = RecipeFormSchema.safeParse({
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
				<p className="text-caption">{t("recipeCreatePage.subtitle")}</p>
			</header>

			<form className="recipe-create-form" onSubmit={handleSubmit} noValidate>
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

				<RecipeIngredientSection
					rows={ingredients}
					ingredientOptions={ingredientOptions}
					onChange={setIngredients}
				/>

				<RecipeInstructionSection
					rows={instructions}
					onChange={setInstructions}
				/>

				<RecipeCategorySection
					categories={categories}
					selectedIds={selectedCategoryIds}
					onTypeChange={handleCategoryTypeChange}
				/>

				{formError ? (
					<p className="recipe-create-error text-caption-s" role="alert">
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
