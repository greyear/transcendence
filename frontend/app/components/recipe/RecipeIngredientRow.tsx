import { Menu, XmarkCircle } from "iconoir-react";
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
	index: number;
	isOnly: boolean;
	onChange: (field: keyof Omit<IngredientRow, "id">, value: string) => void;
	onRemove: () => void;
};

export const RecipeIngredientRow = ({
	ingredient,
	index,
	isOnly,
	onChange,
	onRemove,
}: RecipeIngredientRowProps) => {
	return (
		<li className="recipe-ingredient-row">
			<span className="recipe-drag-handle" aria-hidden="true">
				<Menu />
			</span>
			<input
				type="number"
				className="recipe-create-input recipe-ingredient-amount text-body3"
				placeholder="Amount"
				min={0}
				value={ingredient.amount}
				onChange={(e) => onChange("amount", e.target.value)}
				aria-label={`Ingredient ${index + 1} amount`}
			/>
			<div className="recipe-unit-wrapper">
				<SelectField
					options={UNIT_SELECT_OPTIONS}
					value={ingredient.unit}
					onChange={(value) => onChange("unit", value)}
				/>
			</div>
			<input
				type="text"
				className="recipe-create-input recipe-ingredient-name text-body3"
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
