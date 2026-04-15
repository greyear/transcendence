import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext } from "@hello-pangea/dnd";
import { useId, useState } from "react";
import type { InstructionRow } from "~/components/recipe/RecipeInstructionItem";
import { RecipeInstructionItem } from "~/components/recipe/RecipeInstructionItem";
import { RecipeSortableItem } from "~/components/recipe/RecipeSortableItem";
import { RecipeSortableList } from "~/components/recipe/RecipeSortableList";

const newId = () => Math.random().toString(36).slice(2);

type RecipeInstructionSectionProps = {
	onChange: (rows: InstructionRow[]) => void;
};

export const RecipeInstructionSection = ({
	onChange,
}: RecipeInstructionSectionProps) => {
	const baseId = useId();
	const [rows, setRows] = useState<InstructionRow[]>([
		{ id: `${baseId}-s0`, text: "" },
	]);

	const update = (next: InstructionRow[]) => {
		setRows(next);
		onChange(next);
	};

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}
		const next = [...rows];
		const [removed] = next.splice(result.source.index, 1);
		next.splice(result.destination.index, 0, removed);
		update(next);
	};

	const handleAdd = () => {
		update([...rows, { id: newId(), text: "" }]);
	};

	const handleRemove = (id: string) => {
		update(rows.filter((r) => r.id !== id));
	};

	const handleChange = (id: string, value: string) => {
		update(rows.map((r) => (r.id === id ? { ...r, text: value } : r)));
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
					ordered
					className="recipe-create-list recipe-instructions-list"
				>
					{rows.map((row, index) => (
						<RecipeSortableItem key={row.id} id={row.id} index={index}>
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
						</RecipeSortableItem>
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
