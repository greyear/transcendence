import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Draggable } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";
import type {
	IngredientOption,
	IngredientRow,
} from "~/components/recipe/RecipeIngredientRow";
import {
	createIngredient,
	RecipeIngredientRow,
} from "~/components/recipe/RecipeIngredientRow";
import { RecipeSortableList } from "~/components/recipe/RecipeSortableList";

type RecipeIngredientSectionProps = {
	rows: IngredientRow[];
	ingredientOptions: IngredientOption[];
	onChange: (rows: IngredientRow[]) => void;
};

export const RecipeIngredientSection = ({
	rows,
	ingredientOptions,
	onChange,
}: RecipeIngredientSectionProps) => {
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
		onChange([...rows, createIngredient()]);
	};

	const handleRemove = (id: string) => {
		onChange(rows.filter((r) => r.id !== id));
	};

	const handleChange = (
		id: string,
		patch: Partial<Omit<IngredientRow, "id">>,
	) => {
		onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
	};

	return (
		<section
			className="recipe-create-field"
			aria-labelledby="ingredients-heading"
		>
			<h2 id="ingredients-heading" className="recipe-create-label">
				{t("recipeCreatePage.ingredientsHeading")}{" "}
				<span className="recipe-create-required" aria-hidden="true">
					*
				</span>
			</h2>
			<DragDropContext onDragEnd={handleDragEnd}>
				<RecipeSortableList
					droppableId="ingredients"
					type="ingredients"
					className="recipe-create-list"
					ariaLabel={t("recipeCreateAria.ingredientsList")}
				>
					{rows.map((row, index) => (
						<Draggable key={row.id} draggableId={row.id} index={index}>
							{(provided) => (
								<RecipeIngredientRow
									provided={provided}
									ingredient={row}
									ingredientOptions={ingredientOptions}
									index={index}
									isOnly={rows.length === 1}
									onChange={(patch) => handleChange(row.id, patch)}
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
				{t("recipeCreatePage.addIngredient")}
			</button>
		</section>
	);
};
