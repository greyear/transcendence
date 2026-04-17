import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable } from "@hello-pangea/dnd";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import {
	createInstruction,
	RecipeInstructionItem,
} from "~/components/recipe/RecipeInstructionItem";
import { RecipeSortableList } from "~/components/recipe/RecipeSortableList";

type RecipeInstructionSectionProps = {
	rows: InstructionRow[];
	onChange: (rows: InstructionRow[]) => void;
};

export const RecipeInstructionSection = ({
	rows,
	onChange,
}: RecipeInstructionSectionProps) => {
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
		onChange([...rows, createInstruction()]);
	};

	const handleRemove = (id: string) => {
		onChange(rows.filter((r) => r.id !== id));
	};

	const handleChange = (id: string, value: string) => {
		onChange(rows.map((r) => (r.id === id ? { ...r, text: value } : r)));
	};

	return (
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
			<DragDropContext onDragEnd={handleDragEnd}>
				<RecipeSortableList
					droppableId="instructions"
					type="instructions"
					className="recipe-create-list recipe-instructions-list"
					ariaLabel="Instructions list"
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
			>
				+ Add step
			</button>
		</section>
	);
};
