import { useId } from "react";
import { useTranslation } from "react-i18next";
import { MultiSelectField } from "~/components/inputs/MultiSelectField";
import {
	CATEGORY_TYPE_CODES,
	type CategoryMap,
	type CategoryTypeCode,
} from "~/components/recipe/RecipeCategorySection";
import "~/assets/styles/searchFilterPanel.css";

export type SearchFilterValues = Record<CategoryTypeCode, string[]>;

type SearchFilterPanelProps = {
	categories: CategoryMap;
	values: SearchFilterValues;
	onChange: (typeCode: CategoryTypeCode, codes: string[]) => void;
};

export const SearchFilterPanel = ({
	categories,
	values,
	onChange,
}: SearchFilterPanelProps) => {
	const { t } = useTranslation();
	const baseId = useId();

	return (
		<fieldset className="search-filter-panel">
			{CATEGORY_TYPE_CODES.map((typeCode) => {
				const options = categories[typeCode] ?? [];
				const label = t(`recipeCreatePage.categoryTypeLabel.${typeCode}`);
				const fieldId = `${baseId}-${typeCode}`;

				const selectOptions = options.map((option) => ({
					label: option.name,
					value: option.code,
				}));

				return (
					<div key={typeCode} className="search-filter-panel__field">
						<label
							htmlFor={fieldId}
							className="search-filter-panel__label text-label"
						>
							{label}
						</label>
						<MultiSelectField
							inputId={fieldId}
							options={selectOptions}
							value={values[typeCode]}
							placeholder={t("recipeCreatePage.categoriesPlaceholder")}
							ariaLabel={label}
							onChange={(codes) => onChange(typeCode, codes)}
						/>
					</div>
				);
			})}
		</fieldset>
	);
};
