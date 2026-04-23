import type { DraggableProvided } from "@hello-pangea/dnd";
import { Menu, XmarkCircle } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "~/components/buttons/IconButton";
import { InputField } from "~/components/inputs/InputField";
import { SelectField } from "~/components/inputs/SelectField";

export type IngredientOption = {
	id: number;
	name: string;
};

export type UnitOption = {
	code: string;
	kind: string;
	name?: string;
};

export type IngredientRow = {
	id: string;
	ingredientId: number | null;
	amount: number | "";
	unit: string;
};

export const createIngredient = (): IngredientRow => ({
	id: crypto.randomUUID(),
	ingredientId: null,
	amount: "",
	unit: "",
});

type RecipeIngredientRowProps = {
	ingredient: IngredientRow;
	ingredientOptions: IngredientOption[];
	unitOptions: UnitOption[];
	provided: DraggableProvided;
	index: number;
	isOnly: boolean;
	onChange: (patch: Partial<Omit<IngredientRow, "id">>) => void;
	onRemove: () => void;
};

export const RecipeIngredientRow = ({
	ingredient,
	ingredientOptions,
	unitOptions,
	provided,
	index,
	isOnly,
	onChange,
	onRemove,
}: RecipeIngredientRowProps) => {
	const { t } = useTranslation();
	const number = index + 1;
	const selectOptions = ingredientOptions.map((option) => ({
		label: option.name,
		value: String(option.id),
	}));
	const unitSelectOptions = unitOptions.map((unit) => ({
		label: unit.name ? `${unit.name} (${unit.code})` : unit.code,
		value: unit.code,
	}));
	const selectValue =
		ingredient.ingredientId !== null ? String(ingredient.ingredientId) : "";
	return (
		<li ref={provided.innerRef} {...provided.draggableProps}>
			<fieldset className="recipe-ingredient-row">
				<legend className="recipe-ingredient-legend">
					{t("recipeCreateAria.ingredientLegend", { number })}
				</legend>
				<button
					type="button"
					className="recipe-drag-handle"
					{...provided.dragHandleProps}
					aria-label={t("recipeCreateAria.reorderIngredient", { number })}
				>
					<Menu aria-hidden="true" />
				</button>
				<SelectField
					inputId={`${ingredient.id}-name`}
					options={selectOptions}
					placeholder={t("recipeCreatePage.ingredientNamePlaceholder")}
					value={selectValue}
					onChange={(value) => {
						const parsed = Number.parseInt(value, 10);
						onChange({
							ingredientId: Number.isNaN(parsed) ? null : parsed,
						});
					}}
					className="recipe-ingredient-name"
					ariaLabel={t("recipeCreateAria.ingredientName", { number })}
				/>
				<InputField
					id={`${ingredient.id}-amount`}
					type="number"
					className="recipe-ingredient-amount"
					placeholder={t("recipeCreatePage.ingredientAmountPlaceholder")}
					min={0}
					required
					value={ingredient.amount}
					onChange={(e) => {
						const v = e.target.valueAsNumber;
						onChange({ amount: Number.isNaN(v) ? "" : v });
					}}
					aria-label={t("recipeCreateAria.ingredientAmount", { number })}
				/>
				<SelectField
					inputId={`${ingredient.id}-unit`}
					options={unitSelectOptions}
					placeholder={t("recipeCreatePage.ingredientUnitPlaceholder")}
					value={ingredient.unit}
					onChange={(value) => onChange({ unit: value })}
					className="recipe-ingredient-unit"
					ariaLabel={t("recipeCreateAria.ingredientUnit", { number })}
				/>
				<IconButton
					variant="transparent"
					className="recipe-remove-button"
					onClick={onRemove}
					aria-label={t("recipeCreateAria.removeIngredient", { number })}
					disabled={isOnly}
				>
					<XmarkCircle aria-hidden="true" />
				</IconButton>
			</fieldset>
		</li>
	);
};
