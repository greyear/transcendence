import { useTranslation } from "react-i18next";

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

type RecipeCategorySectionProps = {
	categories: CategoryMap;
	selectedIds: Set<number>;
	onToggle: (id: number) => void;
};

export const RecipeCategorySection = ({
	categories,
	selectedIds,
	onToggle,
}: RecipeCategorySectionProps) => {
	const { t } = useTranslation();

	return (
		<section
			className="recipe-create-field"
			aria-labelledby="categories-heading"
		>
			<h2 id="categories-heading" className="recipe-create-label">
				{t("recipeCreatePage.categoriesHeading")}
			</h2>
			{CATEGORY_TYPE_CODES.map((typeCode) => {
				const options = categories[typeCode] ?? [];
				if (options.length === 0) {
					return null;
				}
				return (
					<fieldset
						key={typeCode}
						className="recipe-create-fieldset recipe-category-group"
					>
						<legend className="recipe-create-label">
							{t(`recipeCreatePage.categoryTypeLabel.${typeCode}`)}
						</legend>
						<ul className="recipe-category-list">
							{options.map((option) => {
								const inputId = `category-${typeCode}-${option.id}`;
								const checked = selectedIds.has(option.id);
								return (
									<li key={option.id} className="recipe-category-item">
										<input
											id={inputId}
											type="checkbox"
											className="recipe-category-checkbox"
											checked={checked}
											onChange={() => onToggle(option.id)}
										/>
										<label htmlFor={inputId} className="recipe-category-label">
											{option.name}
										</label>
									</li>
								);
							})}
						</ul>
					</fieldset>
				);
			})}
		</section>
	);
};
