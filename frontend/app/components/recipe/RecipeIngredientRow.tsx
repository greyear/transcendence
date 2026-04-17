import type { DraggableProvided } from "@hello-pangea/dnd";
import { Menu, XmarkCircle } from "iconoir-react";
import { IconButton } from "~/components/buttons/IconButton";
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
	amount: number | "";
	unit: string;
	name: string;
};

export const createIngredient = (): IngredientRow => ({
	id: crypto.randomUUID(),
	amount: "",
	unit: "g",
	name: "",
});

type RecipeIngredientRowProps = {
	ingredient: IngredientRow;
	provided: DraggableProvided;
	index: number;
	isOnly: boolean;
	onChange: (patch: Partial<Omit<IngredientRow, "id">>) => void;
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
	const label = `Ingredient ${index + 1}`;
	return (
		<li ref={provided.innerRef} {...provided.draggableProps}>
			<fieldset className="recipe-ingredient-row">
				<legend className="recipe-ingredient-legend">{label}</legend>
				<span className="recipe-drag-handle" {...provided.dragHandleProps}>
					<Menu aria-hidden="true" />
				</span>
				<InputField
					id={`${ingredient.id}-name`}
					type="text"
					className="recipe-ingredient-name"
					placeholder="Ingredient name"
					required
					value={ingredient.name}
					onChange={(e) => onChange({ name: e.target.value })}
					aria-label={`${label} name`}
				/>
				<InputField
					id={`${ingredient.id}-amount`}
					type="number"
					className="recipe-ingredient-amount"
					placeholder="Amount"
					min={0}
					required
					value={ingredient.amount}
					onChange={(e) => {
						const v = e.target.valueAsNumber;
						onChange({ amount: Number.isNaN(v) ? "" : v });
					}}
					aria-label={`${label} amount`}
				/>
				<SelectField
					inputId={`${ingredient.id}-unit`}
					options={UNIT_SELECT_OPTIONS}
					value={ingredient.unit}
					onChange={(value) => onChange({ unit: value })}
					className="recipe-ingredient-unit"
					ariaLabel={`${label} unit`}
				/>
				<IconButton
					variant="transparent"
					className="recipe-remove-button"
					onClick={onRemove}
					aria-label={`Remove ${label.toLowerCase()}`}
					disabled={isOnly}
				>
					<XmarkCircle aria-hidden="true" />
				</IconButton>
			</fieldset>
		</li>
	);
};
