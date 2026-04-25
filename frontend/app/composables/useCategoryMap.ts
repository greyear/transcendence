import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	CATEGORY_TYPE_CODES,
	type CategoryMap,
	type CategoryTypeCode,
} from "~/components/recipe/RecipeCategorySection";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

const CategoryListItemSchema = z.object({
	id: z.number().int().positive(),
	code: z.string(),
	name: z.string(),
});

const makeCategoryResponseSchema = (typeCode: CategoryTypeCode) =>
	z.object({
		[typeCode]: z.array(CategoryListItemSchema),
	});

const emptyCategoryMap = (): CategoryMap => ({
	meal_time: [],
	dish_type: [],
	main_ingredient: [],
	cuisine: [],
});

export const useCategoryMap = (): CategoryMap => {
	const { i18n } = useTranslation();
	const language = i18n.resolvedLanguage ?? "en";
	const [categories, setCategories] = useState<CategoryMap>(emptyCategoryMap);

	useEffect(() => {
		let cancelled = false;

		const fetchCategoryType = async (typeCode: CategoryTypeCode) => {
			try {
				const response = await fetch(`${API_BASE_URL}/recipes/${typeCode}`, {
					headers: { "X-Language": language },
				});
				if (!response.ok) {
					return;
				}
				const body: unknown = await response.json();
				const parsed = makeCategoryResponseSchema(typeCode).safeParse(body);
				if (!parsed.success) {
					return;
				}
				const items = parsed.data[typeCode] ?? [];
				if (!cancelled) {
					setCategories((prev) => ({ ...prev, [typeCode]: items }));
				}
			} catch {}
		};

		for (const typeCode of CATEGORY_TYPE_CODES) {
			void fetchCategoryType(typeCode);
		}

		return () => {
			cancelled = true;
		};
	}, [language]);

	return categories;
};
