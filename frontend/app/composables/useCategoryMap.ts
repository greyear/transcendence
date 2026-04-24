import { useEffect, useState } from "react";
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
	const [categories, setCategories] = useState<CategoryMap>(emptyCategoryMap);

	useEffect(() => {
		let cancelled = false;

		const fetchCategoryType = async (typeCode: CategoryTypeCode) => {
			try {
				const response = await fetch(`${API_BASE_URL}/recipes/${typeCode}`);
				if (!response.ok) {
					console.error(
						`Failed to fetch categories ${typeCode}: ${response.status}`,
					);
					return;
				}
				const body: unknown = await response.json();
				const parsed = makeCategoryResponseSchema(typeCode).safeParse(body);
				if (!parsed.success) {
					console.error(
						`Unexpected categories response for ${typeCode}`,
						parsed.error,
					);
					return;
				}
				const items = parsed.data[typeCode] ?? [];
				if (!cancelled) {
					setCategories((prev) => ({ ...prev, [typeCode]: items }));
				}
			} catch (error) {
				console.error(error);
			}
		};

		for (const typeCode of CATEGORY_TYPE_CODES) {
			void fetchCategoryType(typeCode);
		}

		return () => {
			cancelled = true;
		};
	}, []);

	return categories;
};
