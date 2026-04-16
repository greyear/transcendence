import type { DraggableProvided } from "@hello-pangea/dnd";
import { Menu, XmarkCircle } from "iconoir-react";
import { InputField } from "~/components/inputs/InputField";
import { SelectField } from "~/components/inputs/SelectField";

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

export type IngredientRow = {
	id: string;
	amount: string;
	unit: string;
	name: string;
};

type RecipeIngredientRowProps = {
	ingredient: IngredientRow;
	provided: DraggableProvided;
	index: number;
	isOnly: boolean;
	onChange: (field: keyof Omit<IngredientRow, "id">, value: string) => void;
	onRemove: () => void;
};

export const RecipeIngredientRow = ({
	ingredient,
	provided,
	index,
	isOnly,
	onChange,
	onRemove,
}: RecipeIngredientRowProps) => {
	return (
		<li
			ref={provided.innerRef}
			{...provided.draggableProps}
			className="recipe-ingredient-row"
		>
			<span className="recipe-drag-handle" {...provided.dragHandleProps}>
				<Menu aria-hidden="true" />
			</span>
			<InputField
				id={`${ingredient.id}-amount`}
				type="number"
				className="recipe-ingredient-amount"
				placeholder="Amount"
				min={0}
				value={ingredient.amount}
				onChange={(e) => onChange("amount", e.target.value)}
				aria-label={`Ingredient ${index + 1} amount`}
			/>
			<SelectField
				options={UNIT_SELECT_OPTIONS}
				value={ingredient.unit}
				onChange={(value) => onChange("unit", value)}
			/>
			<InputField
				id={`${ingredient.id}-name`}
				type="text"
				className="recipe-ingredient-name"
				placeholder="e.g. milk"
				value={ingredient.name}
				onChange={(e) => onChange("name", e.target.value)}
				aria-label={`Ingredient ${index + 1} name`}
			/>
			<button
				type="button"
				className="recipe-remove-button"
				onClick={onRemove}
				aria-label={`Remove ingredient ${index + 1}`}
				disabled={isOnly}
			>
				<XmarkCircle aria-hidden="true" />
			</button>
		</li>
	);
};
