import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import {
	createInstruction,
	RecipeInstructionItem,
} from "~/components/recipe/RecipeInstructionItem";
import { RecipeSortableList } from "~/components/recipe/RecipeSortableList";

const MAX_INSTRUCTIONS = 50;

type RecipeInstructionSectionProps = {
	rows: InstructionRow[];
	onChange: (rows: InstructionRow[]) => void;
};

export const RecipeInstructionSection = ({
	rows,
	onChange,
}: RecipeInstructionSectionProps) => {
	const { t } = useTranslation();
	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}
		const next = [...rows];
		const [moved] = next.splice(result.source.index, 1);
		next.splice(result.destination.index, 0, moved);
		onChange(next);
	};

	const handleAdd = () => {
		if (rows.length >= MAX_INSTRUCTIONS) {
			return;
		}

		onChange([...rows, createInstruction()]);
	};

	const handleRemove = (id: string) => {
		onChange(rows.filter((r) => r.id !== id));
	};

	const handleChange = (id: string, value: string) => {
		onChange(rows.map((r) => (r.id === id ? { ...r, text: value } : r)));
	};

	const isAddDisabled = rows.length >= MAX_INSTRUCTIONS;

	return (
		<section
			className="recipe-create-field"
			aria-labelledby="instructions-heading"
		>
			<h2 id="instructions-heading" className="recipe-create-label">
				{t("recipeCreatePage.instructionsHeading")}{" "}
				<span className="recipe-create-required" aria-hidden="true">
					*
				</span>
			</h2>
			<DragDropContext onDragEnd={handleDragEnd}>
				<RecipeSortableList
					droppableId="instructions"
					type="instructions"
					className="recipe-create-list recipe-instructions-list"
					ariaLabel={t("recipeCreateAria.instructionsList")}
				>
					{rows.map((row, index) => (
						<Draggable key={row.id} draggableId={row.id} index={index}>
							{(provided) => (
								<RecipeInstructionItem
									provided={provided}
									step={row}
									index={index}
									isOnly={rows.length === 1}
									onChange={(value) => handleChange(row.id, value)}
									onRemove={() => handleRemove(row.id)}
								/>
							)}
						</Draggable>
					))}
				</RecipeSortableList>
			</DragDropContext>
			<button
				type="button"
				className="recipe-add-button text-body3"
				onClick={handleAdd}
				disabled={isAddDisabled}
				aria-describedby={isAddDisabled ? "instructions-max-note" : undefined}
			>
				{t("recipeCreatePage.addStep")}
			</button>
			{isAddDisabled ? (
				<p
					id="instructions-max-note"
					className="recipe-create-hint text-caption-s"
				>
					{t("recipeCreateValidation.instructionsMax", {
						count: MAX_INSTRUCTIONS,
					})}
				</p>
			) : null}
		</section>
	);
};
