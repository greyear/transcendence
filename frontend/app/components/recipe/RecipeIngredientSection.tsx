import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext } from "@hello-pangea/dnd";
import { useId, useState } from "react";
import type { IngredientRow } from "~/components/recipe/RecipeIngredientRow";
import { RecipeIngredientRow } from "~/components/recipe/RecipeIngredientRow";
import { RecipeSortableItem } from "~/components/recipe/RecipeSortableItem";
import { RecipeSortableList } from "~/components/recipe/RecipeSortableList";

const newId = () => Math.random().toString(36).slice(2);

type RecipeIngredientSectionProps = {
	onChange: (rows: IngredientRow[]) => void;
};

export const RecipeIngredientSection = ({
	onChange,
}: RecipeIngredientSectionProps) => {
	const baseId = useId();
	const [rows, setRows] = useState<IngredientRow[]>([
		{ id: `${baseId}-i0`, amount: "", unit: "g", name: "" },
	]);

	const update = (next: IngredientRow[]) => {
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
		update([...rows, { id: newId(), amount: "", unit: "g", name: "" }]);
	};

	const handleRemove = (id: string) => {
		update(rows.filter((r) => r.id !== id));
	};

	const handleChange = (
		id: string,
		field: keyof Omit<IngredientRow, "id">,
		value: string,
	) => {
		update(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
	};

	return (
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
			<DragDropContext onDragEnd={handleDragEnd}>
				<RecipeSortableList
					droppableId="ingredients"
					type="ingredients"
					className="recipe-create-list"
					ariaLabel="Ingredients list"
				>
					{rows.map((row, index) => (
						<RecipeSortableItem key={row.id} id={row.id} index={index}>
							{(provided) => (
								<RecipeIngredientRow
									provided={provided}
									ingredient={row}
									index={index}
									isOnly={rows.length === 1}
									onChange={(field, value) =>
										handleChange(row.id, field, value)
									}
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
				+ Add ingredient
			</button>
		</section>
	);
};
