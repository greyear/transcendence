import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { useId, useState } from "react";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import type { IngredientRow } from "~/components/recipe/RecipeIngredientRow";
import { RecipeIngredientRow } from "~/components/recipe/RecipeIngredientRow";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import { RecipeInstructionItem } from "~/components/recipe/RecipeInstructionItem";
import { RecipePhotoUpload } from "~/components/recipe/RecipePhotoUpload";
import "../assets/styles/recipe-create.css";

type IngredientFields = Omit<IngredientRow, "id">;
type InstructionFields = Omit<InstructionRow, "id">;

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

const newId = () => Math.random().toString(36).slice(2);

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

	// useId gives a stable ID across Strict Mode remounts (determined by tree position)
	const baseId = useId();

	const [ingredientIds, setIngredientIds] = useState<string[]>([
		`${baseId}-i0`,
		`${baseId}-i1`,
	]);
	const [ingredientFields, setIngredientFields] = useState<
		Record<string, IngredientFields>
	>({
		[`${baseId}-i0`]: { amount: "", unit: "g", name: "" },
		[`${baseId}-i1`]: { amount: "", unit: "g", name: "" },
	});

	const [instructionIds, setInstructionIds] = useState<string[]>([
		`${baseId}-s0`,
		`${baseId}-s1`,
	]);
	const [instructionFields, setInstructionFields] = useState<
		Record<string, InstructionFields>
	>({
		[`${baseId}-s0`]: { text: "" },
		[`${baseId}-s1`]: { text: "" },
	});

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}
		const { source, destination, type } = result;
		const reorder = (ids: string[]) => {
			const next = [...ids];
			const [removed] = next.splice(source.index, 1);
			next.splice(destination.index, 0, removed);
			return next;
		};
		if (type === "ingredients") {
			setIngredientIds((prev) => reorder(prev));
		} else if (type === "instructions") {
			setInstructionIds((prev) => reorder(prev));
		}
	};

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
		const id = newId();
		setIngredientIds((prev) => [...prev, id]);
		setIngredientFields((prev) => ({
			...prev,
			[id]: { amount: "", unit: "g", name: "" },
		}));
	};

	const handleRemoveIngredient = (id: string) => {
		setIngredientIds((prev) => prev.filter((i) => i !== id));
		setIngredientFields((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	};

	const handleIngredientChange = (
		id: string,
		field: keyof IngredientFields,
		value: string,
	) => {
		setIngredientFields((prev) => ({
			...prev,
			[id]: { ...prev[id], [field]: value },
		}));
	};

	const handleAddInstruction = () => {
		const id = newId();
		setInstructionIds((prev) => [...prev, id]);
		setInstructionFields((prev) => ({ ...prev, [id]: { text: "" } }));
	};

	const handleRemoveInstruction = (id: string) => {
		setInstructionIds((prev) => prev.filter((i) => i !== id));
		setInstructionFields((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		});
	};

	const handleInstructionChange = (id: string, value: string) => {
		setInstructionFields((prev) => ({ ...prev, [id]: { text: value } }));
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
			ingredients: ingredientIds.map((id) => ingredientFields[id] ?? {}),
			instructions: instructionIds.map((id) => instructionFields[id] ?? {}),
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
		<DragDropContext onDragEnd={handleDragEnd}>
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
						<Droppable droppableId="ingredients" type="ingredients">
							{(provided) => (
								<ul
									ref={provided.innerRef}
									{...provided.droppableProps}
									className="recipe-create-list"
									aria-label="Ingredients list"
								>
									{ingredientIds.map((id, index) => (
										<Draggable key={id} draggableId={id} index={index}>
											{(provided) => (
												<RecipeIngredientRow
													provided={provided}
													ingredient={{
														id,
														...(ingredientFields[id] ?? {
															amount: "",
															unit: "g",
															name: "",
														}),
													}}
													index={index}
													isOnly={ingredientIds.length === 1}
													onChange={(field, value) =>
														handleIngredientChange(id, field, value)
													}
													onRemove={() => handleRemoveIngredient(id)}
												/>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</ul>
							)}
						</Droppable>
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
						<Droppable droppableId="instructions" type="instructions">
							{(provided) => (
								<ol
									ref={provided.innerRef}
									{...provided.droppableProps}
									className="recipe-create-list recipe-instructions-list"
								>
									{instructionIds.map((id, index) => (
										<Draggable key={id} draggableId={id} index={index}>
											{(provided) => (
												<RecipeInstructionItem
													provided={provided}
													step={{
														id,
														...(instructionFields[id] ?? { text: "" }),
													}}
													index={index}
													isOnly={instructionIds.length === 1}
													onChange={(value) =>
														handleInstructionChange(id, value)
													}
													onRemove={() => handleRemoveInstruction(id)}
												/>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</ol>
							)}
						</Droppable>
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
		</DragDropContext>
	);
};

export default RecipeCreate;
