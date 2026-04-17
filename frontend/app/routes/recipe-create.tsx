import { useRef, useState } from "react";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import { InputField } from "~/components/inputs/InputField";
import { RecipeFormField } from "~/components/recipe/RecipeFormField";
import { RecipeFormFieldset } from "~/components/recipe/RecipeFormFieldset";
import type { IngredientRow } from "~/components/recipe/RecipeIngredientRow";
import { RecipeIngredientSection } from "~/components/recipe/RecipeIngredientSection";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import { RecipeInstructionSection } from "~/components/recipe/RecipeInstructionSection";
import { RecipePhotoUpload } from "~/components/recipe/RecipePhotoUpload";
import "../assets/styles/recipe-create.css";

const RecipeFormSchema = z.object({
	title: z.string().min(1, "Recipe title is required"),
	description: z
		.string()
		.min(1, "Description is required")
		.max(128, "Description must be at most 128 characters"),
	servings: z.string().min(1, "Servings is required"),
	prepHours: z.string(),
	prepMinutes: z.string(),
	cookHours: z.string(),
	cookMinutes: z.string(),
	ingredients: z
		.array(
			z.object({
				amount: z.string().min(1, "Ingredient amount is required"),
				unit: z.string().min(1, "Ingredient unit is required"),
				name: z.string().min(1, "Ingredient name is required"),
			}),
		)
		.min(1, "At least one ingredient is required"),
	instructions: z
		.array(z.object({ text: z.string().min(1, "Step text is required") }))
		.min(1, "At least one instruction step is required"),
});

const RecipeCreate = () => {
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [servings, setServings] = useState("");
	const [prepHours, setPrepHours] = useState("");
	const [prepMinutes, setPrepMinutes] = useState("");
	const [cookHours, setCookHours] = useState("");
	const [cookMinutes, setCookMinutes] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Refs hold the latest section values without causing re-renders on every keystroke.
	// Default rows match each section's initial state so Zod gives field-level errors
	// (e.g. "Ingredient amount is required") even if the user never touches those sections.
	const ingredientsRef = useRef<IngredientRow[]>([
		{ id: "", amount: "", unit: "g", name: "" },
	]);
	const instructionsRef = useRef<InstructionRow[]>([{ id: "", text: "" }]);

	const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		if (photoPreview) {
			URL.revokeObjectURL(photoPreview);
		}
		setPhotoPreview(URL.createObjectURL(file));
	};

	const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);

		const parsed = RecipeFormSchema.safeParse({
			title,
			description,
			servings,
			prepHours,
			prepMinutes,
			cookHours,
			cookMinutes,
			ingredients: ingredientsRef.current,
			instructions: instructionsRef.current,
		});

		if (!parsed.success) {
			setFormError(
				parsed.error.issues[0]?.message ?? "Please fix the errors above.",
			);
			return;
		}

		setIsSubmitting(true);
		// TODO: submit to API
		setIsSubmitting(false);
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
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
				</RecipeFormField>

				<RecipeFormField
					label="Short Description"
					htmlFor="recipe-description"
					required
				>
					<textarea
						id="recipe-description"
						className="recipe-create-textarea text-body3"
						placeholder="Describe your recipe in a way that makes mouths water. Max 128 characters"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						maxLength={128}
					/>
				</RecipeFormField>

				<RecipeFormField label="Servings" htmlFor="recipe-servings" required>
					<InputField
						id="recipe-servings"
						type="number"
						placeholder="e.g. 2"
						floatingLabel={false}
						min={1}
						value={servings}
						onChange={(e) => setServings(e.target.value)}
					/>
				</RecipeFormField>

				<RecipeFormFieldset legend="Prep Time" required>
					<div className="recipe-create-time-row">
						<InputField
							id="prep-hours"
							type="number"
							placeholder="hours"
							min={0}
							value={prepHours}
							onChange={(e) => setPrepHours(e.target.value)}
							aria-label="Prep time hours"
						/>
						<InputField
							id="prep-minutes"
							type="number"
							placeholder="minutes"
							min={0}
							max={59}
							value={prepMinutes}
							onChange={(e) => setPrepMinutes(e.target.value)}
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
							value={cookHours}
							onChange={(e) => setCookHours(e.target.value)}
							aria-label="Cook time hours"
						/>
						<InputField
							id="cook-minutes"
							type="number"
							placeholder="minutes"
							min={0}
							max={59}
							value={cookMinutes}
							onChange={(e) => setCookMinutes(e.target.value)}
							aria-label="Cook time minutes"
						/>
					</div>
				</RecipeFormFieldset>

				<RecipeIngredientSection
					onChange={(rows) => {
						ingredientsRef.current = rows;
					}}
				/>

				<RecipeInstructionSection
					onChange={(rows) => {
						instructionsRef.current = rows;
					}}
				/>

				{formError ? (
					<p
						className="recipe-create-error text-caption-s"
						role="alert"
						aria-live="polite"
					>
						{formError}
					</p>
				) : null}

				<MainButton
					type="submit"
					className="recipe-create-submit"
					disabled={isSubmitting}
				>
					{isSubmitting ? "Creating..." : "Create"}
				</MainButton>
			</form>
		</section>
	);
};

export default RecipeCreate;
