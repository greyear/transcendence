import { Filter } from "iconoir-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { MultiSelectField } from "~/components/inputs/MultiSelectField";
import {
	CATEGORY_TYPE_CODES,
	type CategoryMap,
	type CategoryTypeCode,
} from "~/components/recipe/RecipeCategorySection";
import "~/assets/styles/searchFilterMenu.css";

export type SearchFilterValues = Record<CategoryTypeCode, string[]>;

type SearchFilterMenuProps = {
	categories: CategoryMap;
	values: SearchFilterValues;
	onChange: (typeCode: CategoryTypeCode, codes: string[]) => void;
};

export const SearchFilterMenu = ({
	categories,
	values,
	onChange,
}: SearchFilterMenuProps) => {
	const { t } = useTranslation();
	const baseId = useId();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}

		const handleOutside = (e: MouseEvent) => {
			if (!ref.current) {
				return;
			}

			if (e.target instanceof Node && !ref.current.contains(e.target)) {
				setOpen(false);
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	return (
		<div className="search-filter-menu" ref={ref}>
			<TextIconButton onClick={() => setOpen((prev) => !prev)} selected={open}>
				{t("common.filterButton")}
				<Filter aria-hidden />
			</TextIconButton>

			{open && (
				<fieldset className="search-filter-menu__dropdown">
					<legend className="search-filter-menu__legend">
						{t("common.filterButton")}
					</legend>
					{CATEGORY_TYPE_CODES.map((typeCode) => {
						const options = categories[typeCode] ?? [];
						const label = t(`recipeCreatePage.categoryTypeLabel.${typeCode}`);
						const fieldId = `${baseId}-${typeCode}`;

						const selectOptions = options.map((option) => ({
							label: option.name,
							value: option.code,
						}));

						return (
							<div key={typeCode} className="search-filter-menu__field">
								<label
									htmlFor={fieldId}
									className="search-filter-menu__label text-label"
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
			)}
		</div>
	);
};
