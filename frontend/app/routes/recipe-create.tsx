import { useEffect, useId, useState } from "react";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import { InputField } from "~/components/inputs/InputField";
import { TextArea } from "~/components/inputs/TextArea";
import { RecipeFormField } from "~/components/recipe/RecipeFormField";
import { RecipeFormFieldset } from "~/components/recipe/RecipeFormFieldset";
import type { IngredientRow } from "~/components/recipe/RecipeIngredientRow";
import { RecipeIngredientSection } from "~/components/recipe/RecipeIngredientSection";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import { RecipeInstructionSection } from "~/components/recipe/RecipeInstructionSection";
import { RecipePhotoUpload } from "~/components/recipe/RecipePhotoUpload";
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

const amountSchema = z.preprocess(
	emptyToUndef,
	z
		.number({ error: "Ingredient amount is required" })
		.positive("Ingredient amount must be positive"),
);

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
		prepHours: hoursSchema("Prep hours"),
		prepMinutes: minutesSchema("Prep minutes"),
		cookHours: hoursSchema("Cook hours"),
		cookMinutes: minutesSchema("Cook minutes"),
		ingredients: z
			.array(
				z.object({
					amount: amountSchema,
					unit: z.string().min(1, "Ingredient unit is required"),
					name: z.string().min(1, "Ingredient name is required"),
				}),
			)
			.min(1, "At least one ingredient is required"),
		instructions: z
			.array(z.object({ text: z.string().min(1, "Step text is required") }))
			.min(1, "At least one instruction step is required"),
	})
	.refine((d) => d.prepHours * 60 + d.prepMinutes > 0, {
		message: "Prep time must be greater than 0",
		path: ["prepHours"],
	})
	.refine((d) => d.cookHours * 60 + d.cookMinutes > 0, {
		message: "Cook time must be greater than 0",
		path: ["cookHours"],
	});

type FormState = {
	title: string;
	description: string;
	servings: NumOrEmpty;
	prepHours: NumOrEmpty;
	prepMinutes: NumOrEmpty;
	cookHours: NumOrEmpty;
	cookMinutes: NumOrEmpty;
};

type NumericField =
	| "servings"
	| "prepHours"
	| "prepMinutes"
	| "cookHours"
	| "cookMinutes";

const initialForm: FormState = {
	title: "",
	description: "",
	servings: "",
	prepHours: "",
	prepMinutes: "",
	cookHours: "",
	cookMinutes: "",
};

const RecipeCreate = () => {
	const baseId = useId();
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [form, setForm] = useState<FormState>(initialForm);
	const [ingredients, setIngredients] = useState<IngredientRow[]>(() => [
		{ id: `${baseId}-i0`, amount: "", unit: "g", name: "" },
	]);
	const [instructions, setInstructions] = useState<InstructionRow[]>(() => [
		{ id: `${baseId}-s0`, text: "" },
	]);
	const [formError, setFormError] = useState<string | null>(null);

	useEffect(() => {
		if (!photoPreview) {
			return;
		}
		return () => {
			URL.revokeObjectURL(photoPreview);
		};
	}, [photoPreview]);

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

	const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);

		const parsed = RecipeFormSchema.safeParse({
			...form,
			ingredients,
			instructions,
		});

		if (!parsed.success) {
			setFormError(
				parsed.error.issues[0]?.message ?? "Please fix the errors above.",
			);
			return;
		}

		// TODO: submit to API
	};

	return (
		<section
			className="recipe-create-page"
			aria-labelledby="recipe-create-heading"
		>
			<header className="recipe-create-header">
				<h1 id="recipe-create-heading">Add a Recipe</h1>
				<p className="text-caption">
					{"Know the recipe that is worth to be famous? Share it with us <3"}
				</p>
			</header>

			<form className="recipe-create-form" onSubmit={handleSubmit} noValidate>
				<RecipePhotoUpload
					photoPreview={photoPreview}
					onChange={handlePhotoChange}
				/>

				<RecipeFormField label="Recipe Title" htmlFor="recipe-title" required>
					<InputField
						id="recipe-title"
						placeholder="Recipe Title"
						floatingLabel={false}
						required
						value={form.title}
						onChange={setText("title")}
					/>
				</RecipeFormField>

				<RecipeFormField
					label="Short Description"
					htmlFor="recipe-description"
					required
				>
					<TextArea
						id="recipe-description"
						className="recipe-description-textarea text-body3"
						placeholder="Describe your recipe in a way that makes mouths water."
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

				<RecipeFormField label="Servings" htmlFor="recipe-servings" required>
					<InputField
						id="recipe-servings"
						type="number"
						placeholder="e.g. 2"
						floatingLabel={false}
						min={1}
						required
						value={form.servings}
						onChange={setNumber("servings")}
					/>
				</RecipeFormField>

				<RecipeFormFieldset legend="Prep Time" required>
					<div className="recipe-create-time-row">
						<InputField
							id="prep-hours"
							type="number"
							placeholder="hours"
							min={0}
							required
							value={form.prepHours}
							onChange={setNumber("prepHours")}
							aria-label="Prep time hours"
						/>
						<InputField
							id="prep-minutes"
							type="number"
							placeholder="minutes"
							min={0}
							max={59}
							required
							value={form.prepMinutes}
							onChange={setNumber("prepMinutes")}
							aria-label="Prep time minutes"
						/>
					</div>
				</RecipeFormFieldset>

				<RecipeFormFieldset legend="Cook Time" required>
					<div className="recipe-create-time-row">
						<InputField
							id="cook-hours"
							type="number"
							placeholder="hours"
							min={0}
							required
							value={form.cookHours}
							onChange={setNumber("cookHours")}
							aria-label="Cook time hours"
						/>
						<InputField
							id="cook-minutes"
							type="number"
							placeholder="minutes"
							min={0}
							max={59}
							required
							value={form.cookMinutes}
							onChange={setNumber("cookMinutes")}
							aria-label="Cook time minutes"
						/>
					</div>
				</RecipeFormFieldset>

				<RecipeIngredientSection rows={ingredients} onChange={setIngredients} />

				<RecipeInstructionSection
					rows={instructions}
					onChange={setInstructions}
				/>

				{formError ? (
					<p className="recipe-create-error text-caption-s" role="alert">
						{formError}
					</p>
				) : null}

				<MainButton type="submit" className="recipe-create-submit">
					Create
				</MainButton>
			</form>
		</section>
	);
};

export default RecipeCreate;
