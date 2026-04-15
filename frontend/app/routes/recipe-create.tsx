import { Menu, PlusCircle, XmarkCircle } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import { SelectField } from "~/components/inputs/SelectField";
import "../assets/styles/recipe-create.css";

const UNIT_OPTIONS = [
	"tsp",
	"tbsp",
	"cup",
	"ml",
	"l",
	"g",
	"kg",
	"oz",
	"lb",
	"piece",
];

const UNIT_SELECT_OPTIONS = UNIT_OPTIONS.map((u) => ({ label: u, value: u }));

const IngredientSchema = z.object({
	amount: z.string().min(1, "Ingredient amount is required"),
	unit: z.string().min(1, "Ingredient unit is required"),
	name: z.string().min(1, "Ingredient name is required"),
});

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
		.array(IngredientSchema)
		.min(1, "At least one ingredient is required"),
	instructions: z
		.array(z.object({ text: z.string().min(1, "Step text is required") }))
		.min(1, "At least one instruction step is required"),
});

type IngredientRow = {
	id: string;
	amount: string;
	unit: string;
	name: string;
};

type InstructionRow = {
	id: string;
	text: string;
};

const createIngredient = (): IngredientRow => ({
	id: Math.random().toString(36).slice(2),
	amount: "",
	unit: "g",
	name: "",
});

const createInstruction = (): InstructionRow => ({
	id: Math.random().toString(36).slice(2),
	text: "",
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
	const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
	const [instructions, setInstructions] = useState<InstructionRow[]>([]);

	useEffect(() => {
		setIngredients([createIngredient(), createIngredient()]);
		setInstructions([createInstruction(), createInstruction()]);
	}, []);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const ingredientDragIndex = useRef<number | null>(null);
	const ingredientDragAllowed = useRef(false);
	const instructionDragIndex = useRef<number | null>(null);
	const instructionDragAllowed = useRef(false);

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

	const handleAddIngredient = () => {
		setIngredients((prev) => [...prev, createIngredient()]);
	};

	const handleRemoveIngredient = (id: string) => {
		setIngredients((prev) => prev.filter((ing) => ing.id !== id));
	};

	const handleIngredientChange = (
		id: string,
		field: keyof Omit<IngredientRow, "id">,
		value: string,
	) => {
		setIngredients((prev) =>
			prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing)),
		);
	};

	const handleIngredientDragStart = (
		e: React.DragEvent<HTMLLIElement>,
		index: number,
	) => {
		if (!ingredientDragAllowed.current) {
			e.preventDefault();
			return;
		}
		ingredientDragIndex.current = index;
	};

	const handleIngredientDragOver = (
		e: React.DragEvent<HTMLLIElement>,
		overIndex: number,
	) => {
		e.preventDefault();
		const fromIndex = ingredientDragIndex.current;
		if (fromIndex === null || fromIndex === overIndex) {
			return;
		}
		setIngredients((prev) => {
			const next = [...prev];
			const [item] = next.splice(fromIndex, 1);
			next.splice(overIndex, 0, item);
			return next;
		});
		ingredientDragIndex.current = overIndex;
	};

	const handleIngredientDragEnd = () => {
		ingredientDragIndex.current = null;
		ingredientDragAllowed.current = false;
	};

	const handleAddInstruction = () => {
		setInstructions((prev) => [...prev, createInstruction()]);
	};

	const handleRemoveInstruction = (id: string) => {
		setInstructions((prev) => prev.filter((step) => step.id !== id));
	};

	const handleInstructionChange = (id: string, value: string) => {
		setInstructions((prev) =>
			prev.map((step) => (step.id === id ? { ...step, text: value } : step)),
		);
	};

	const handleInstructionDragStart = (
		e: React.DragEvent<HTMLLIElement>,
		index: number,
	) => {
		if (!instructionDragAllowed.current) {
			e.preventDefault();
			return;
		}
		instructionDragIndex.current = index;
	};

	const handleInstructionDragOver = (
		e: React.DragEvent<HTMLLIElement>,
		overIndex: number,
	) => {
		e.preventDefault();
		const fromIndex = instructionDragIndex.current;
		if (fromIndex === null || fromIndex === overIndex) {
			return;
		}
		setInstructions((prev) => {
			const next = [...prev];
			const [item] = next.splice(fromIndex, 1);
			next.splice(overIndex, 0, item);
			return next;
		});
		instructionDragIndex.current = overIndex;
	};

	const handleInstructionDragEnd = () => {
		instructionDragIndex.current = null;
		instructionDragAllowed.current = false;
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
			ingredients: ingredients.map(({ amount, unit, name }) => ({
				amount,
				unit,
				name,
			})),
			instructions: instructions.map(({ text }) => ({ text })),
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
				<label
					htmlFor="recipe-photo"
					className="recipe-photo-upload"
					aria-label="Add a recipe photo"
				>
					{photoPreview ? (
						<img
							src={photoPreview}
							alt="Recipe preview"
							className="recipe-photo-preview"
						/>
					) : (
						<span className="recipe-photo-button">
							<PlusCircle aria-hidden="true" />
							Add a photo
						</span>
					)}
					<input
						id="recipe-photo"
						type="file"
						accept="image/*"
						className="recipe-photo-input"
						onChange={handlePhotoChange}
					/>
				</label>

				<div className="recipe-create-field">
					<label htmlFor="recipe-title" className="recipe-create-label">
						Recipe Title{" "}
						<span className="recipe-create-required" aria-hidden="true">
							*
						</span>
					</label>
					<input
						id="recipe-title"
						type="text"
						className="recipe-create-input text-body3"
						placeholder="Recipe Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
					/>
				</div>

				<div className="recipe-create-field">
					<label htmlFor="recipe-description" className="recipe-create-label">
						Short Description{" "}
						<span className="recipe-create-required" aria-hidden="true">
							*
						</span>
					</label>
					<textarea
						id="recipe-description"
						className="recipe-create-textarea text-body3"
						placeholder="Describe your recipe in a way that makes mouths water. Max 128 characters"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						maxLength={128}
					/>
				</div>

				<div className="recipe-create-field">
					<label htmlFor="recipe-servings" className="recipe-create-label">
						Servings{" "}
						<span className="recipe-create-required" aria-hidden="true">
							*
						</span>
					</label>
					<input
						id="recipe-servings"
						type="number"
						className="recipe-create-input text-body3"
						placeholder="e.g. 2"
						min={1}
						value={servings}
						onChange={(e) => setServings(e.target.value)}
					/>
				</div>

				<fieldset className="recipe-create-fieldset">
					<legend className="recipe-create-label">
						Prep Time{" "}
						<span className="recipe-create-required" aria-hidden="true">
							*
						</span>
					</legend>
					<div className="recipe-create-time-row">
						<input
							id="prep-hours"
							type="number"
							className="recipe-create-input text-body3"
							placeholder="hours"
							min={0}
							value={prepHours}
							onChange={(e) => setPrepHours(e.target.value)}
							aria-label="Prep time hours"
						/>
						<input
							id="prep-minutes"
							type="number"
							className="recipe-create-input text-body3"
							placeholder="minutes"
							min={0}
							max={59}
							value={prepMinutes}
							onChange={(e) => setPrepMinutes(e.target.value)}
							aria-label="Prep time minutes"
						/>
					</div>
				</fieldset>

				<fieldset className="recipe-create-fieldset">
					<legend className="recipe-create-label">
						Cook Time{" "}
						<span className="recipe-create-required" aria-hidden="true">
							*
						</span>
					</legend>
					<div className="recipe-create-time-row">
						<input
							id="cook-hours"
							type="number"
							className="recipe-create-input text-body3"
							placeholder="hours"
							min={0}
							value={cookHours}
							onChange={(e) => setCookHours(e.target.value)}
							aria-label="Cook time hours"
						/>
						<input
							id="cook-minutes"
							type="number"
							className="recipe-create-input text-body3"
							placeholder="minutes"
							min={0}
							max={59}
							value={cookMinutes}
							onChange={(e) => setCookMinutes(e.target.value)}
							aria-label="Cook time minutes"
						/>
					</div>
				</fieldset>

				<section
					className="recipe-create-field"
					aria-labelledby="ingredients-heading"
				>
					<h2 id="ingredients-heading" className="recipe-create-label">
						Ingredients{" "}
						<span className="recipe-create-required" aria-hidden="true">
							*
						</span>
					</h2>
					<ul className="recipe-create-list" aria-label="Ingredients list">
						{ingredients.map((ingredient, index) => (
							<li
								key={ingredient.id}
								className="recipe-ingredient-row"
								draggable
								onPointerUp={() => {
									ingredientDragAllowed.current = false;
								}}
								onDragStart={(e) => handleIngredientDragStart(e, index)}
								onDragOver={(e) => handleIngredientDragOver(e, index)}
								onDragEnd={handleIngredientDragEnd}
							>
								<span
									className="recipe-drag-handle"
									aria-hidden="true"
									onPointerDown={() => {
										ingredientDragAllowed.current = true;
									}}
								>
									<Menu />
								</span>
								<input
									type="number"
									className="recipe-create-input recipe-ingredient-amount text-body3"
									placeholder="Amount"
									min={0}
									value={ingredient.amount}
									onChange={(e) =>
										handleIngredientChange(
											ingredient.id,
											"amount",
											e.target.value,
										)
									}
									aria-label={`Ingredient ${index + 1} amount`}
								/>
								<div className="recipe-unit-wrapper">
									<SelectField
										options={UNIT_SELECT_OPTIONS}
										value={ingredient.unit}
										onChange={(value) =>
											handleIngredientChange(ingredient.id, "unit", value)
										}
									/>
								</div>
								<input
									type="text"
									className="recipe-create-input recipe-ingredient-name text-body3"
									placeholder="e.g. milk"
									value={ingredient.name}
									onChange={(e) =>
										handleIngredientChange(
											ingredient.id,
											"name",
											e.target.value,
										)
									}
									aria-label={`Ingredient ${index + 1} name`}
								/>
								<button
									type="button"
									className="recipe-remove-button"
									onClick={() => handleRemoveIngredient(ingredient.id)}
									aria-label={`Remove ingredient ${index + 1}`}
									disabled={ingredients.length === 1}
								>
									<XmarkCircle aria-hidden="true" />
								</button>
							</li>
						))}
					</ul>
					<button
						type="button"
						className="recipe-add-button text-body3"
						onClick={handleAddIngredient}
					>
						+ Add ingredient
					</button>
				</section>

				<section
					className="recipe-create-field"
					aria-labelledby="instructions-heading"
				>
					<h2 id="instructions-heading" className="recipe-create-label">
						Instructions{" "}
						<span className="recipe-create-required" aria-hidden="true">
							*
						</span>
					</h2>
					<ol className="recipe-create-list recipe-instructions-list">
						{instructions.map((step, index) => (
							<li
								key={step.id}
								className="recipe-instruction-item"
								draggable
								onPointerUp={() => {
									instructionDragAllowed.current = false;
								}}
								onDragStart={(e) => handleInstructionDragStart(e, index)}
								onDragOver={(e) => handleInstructionDragOver(e, index)}
								onDragEnd={handleInstructionDragEnd}
							>
								<span className="recipe-step-label text-caption">
									Step {index + 1}
								</span>
								<div className="recipe-instruction-row">
									<span
										className="recipe-drag-handle"
										aria-hidden="true"
										onPointerDown={() => {
											instructionDragAllowed.current = true;
										}}
									>
										<Menu />
									</span>
									<textarea
										className="recipe-instruction-textarea"
										value={step.text}
										rows={1}
										onChange={(e) => {
											handleInstructionChange(step.id, e.target.value);
											e.target.style.height = "auto";
											e.target.style.height = `${e.target.scrollHeight}px`;
										}}
										aria-label={`Step ${index + 1} description`}
									/>
									<button
										type="button"
										className="recipe-remove-button"
										onClick={() => handleRemoveInstruction(step.id)}
										aria-label={`Remove step ${index + 1}`}
										disabled={instructions.length === 1}
									>
										<XmarkCircle aria-hidden="true" />
									</button>
								</div>
							</li>
						))}
					</ol>
					<button
						type="button"
						className="recipe-add-button text-body3"
						onClick={handleAddInstruction}
					>
						+ Add step
					</button>
				</section>

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
