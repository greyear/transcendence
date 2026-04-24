import { Filter } from "iconoir-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MainButton } from "~/components/buttons/MainButton";
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
	onApply: (values: SearchFilterValues) => void;
};

export const SearchFilterMenu = ({
	categories,
	values,
	onApply,
}: SearchFilterMenuProps) => {
	const { t } = useTranslation();
	const baseId = useId();
	const [open, setOpen] = useState(false);
	const [draftValues, setDraftValues] = useState<SearchFilterValues>(values);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (open) {
			setDraftValues(values);
		}
	}, [open, values]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const handleOutside = (e: MouseEvent) => {
			if (!ref.current) {
				return;
			}

			if (!e.composedPath().includes(ref.current)) {
				setOpen(false);
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key !== "Escape") {
				return;
			}

			setOpen(false);
			const trigger = ref.current?.querySelector<HTMLButtonElement>(
				".search-filter-menu__trigger",
			);
			trigger?.focus();
		};

		document.addEventListener("mousedown", handleOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	const handleDraftChange = (typeCode: CategoryTypeCode, codes: string[]) => {
		setDraftValues((prev) => ({ ...prev, [typeCode]: codes }));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		onApply(draftValues);
		setOpen(false);
	};

	const panelId = `${baseId}-panel`;

	return (
		<div className="search-filter-menu" ref={ref}>
			<TextIconButton
				onClick={() => setOpen((prev) => !prev)}
				selected={open}
				className="search-filter-menu__trigger"
				aria-expanded={open}
				aria-controls={panelId}
			>
				{t("common.filterButton")}
				<Filter aria-hidden />
			</TextIconButton>

			{open && (
				<form
					id={panelId}
					className="search-filter-menu__dropdown"
					onSubmit={handleSubmit}
				>
					<fieldset className="search-filter-menu__fields">
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
										value={draftValues[typeCode]}
										placeholder={t("recipeCreatePage.categoriesPlaceholder")}
										ariaLabel={label}
										onChange={(codes) => handleDraftChange(typeCode, codes)}
									/>
								</div>
							);
						})}
					</fieldset>
					<MainButton type="submit">{t("common.applyButton")}</MainButton>
				</form>
			)}
		</div>
	);
};
