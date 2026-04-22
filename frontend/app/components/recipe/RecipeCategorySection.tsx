import { useTranslation } from "react-i18next";
import { MultiSelectField } from "~/components/inputs/MultiSelectField";
import { SelectField } from "~/components/inputs/SelectField";
import { RecipeFormField } from "~/components/recipe/RecipeFormField";

export type CategoryOption = {
	id: number;
	code: string;
	name: string;
};

export const CATEGORY_TYPE_CODES = [
	"meal_time",
	"dish_type",
	"main_ingredient",
	"cuisine",
] as const;

export type CategoryTypeCode = (typeof CATEGORY_TYPE_CODES)[number];

export type CategoryMap = Record<CategoryTypeCode, CategoryOption[]>;

const SINGLE_SELECT_TYPES: ReadonlySet<CategoryTypeCode> = new Set(["cuisine"]);

type RecipeCategorySectionProps = {
	categories: CategoryMap;
	selectedIds: Set<number>;
	onTypeChange: (typeCode: CategoryTypeCode, ids: number[]) => void;
};

const parseId = (value: string): number | null => {
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

export const RecipeCategorySection = ({
	categories,
	selectedIds,
	onTypeChange,
}: RecipeCategorySectionProps) => {
	const { t } = useTranslation();

	return (
		<>
			{CATEGORY_TYPE_CODES.map((typeCode) => {
				const options = categories[typeCode] ?? [];
				if (options.length === 0) {
					return null;
				}
				const fieldId = `category-${typeCode}`;
				const label = t(`recipeCreatePage.categoryTypeLabel.${typeCode}`);
				const selectOptions = options.map((option) => ({
					label: option.name,
					value: String(option.id),
				}));
				const selectedValues = options
					.filter((option) => selectedIds.has(option.id))
					.map((option) => String(option.id));
				const isSingle = SINGLE_SELECT_TYPES.has(typeCode);

				return (
					<RecipeFormField key={typeCode} label={label} htmlFor={fieldId}>
						{isSingle ? (
							<SelectField
								inputId={fieldId}
								options={selectOptions}
								value={selectedValues[0] ?? ""}
								placeholder={t("recipeCreatePage.categoryPlaceholder")}
								ariaLabel={label}
								onChange={(value) => {
									const id = parseId(value);
									onTypeChange(typeCode, id === null ? [] : [id]);
								}}
							/>
						) : (
							<MultiSelectField
								inputId={fieldId}
								options={selectOptions}
								value={selectedValues}
								placeholder={t("recipeCreatePage.categoriesPlaceholder")}
								ariaLabel={label}
								onChange={(values) => {
									const ids = values.reduce<number[]>((acc, raw) => {
										const id = parseId(raw);
										if (id !== null) {
											acc.push(id);
										}
										return acc;
									}, []);
									onTypeChange(typeCode, ids);
								}}
							/>
						)}
					</RecipeFormField>
				);
			})}
		</>
	);
};
