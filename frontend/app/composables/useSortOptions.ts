import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SortOption } from "~/components/SortMenu";

export const useSortOptions = (page: "recipes" | "users"): SortOption[] => {
	const { t } = useTranslation();

	return useMemo(() => {
		const options: SortOption[] = [
			{ label: t("common.sortOptions.nameAsc"), value: "name-asc" },
			{ label: t("common.sortOptions.nameDesc"), value: "name-desc" },
		];

		if (page === "recipes") {
			options.push(
				{ label: t("common.sortOptions.dateAsc"), value: "date-asc" },
				{ label: t("common.sortOptions.dateDesc"), value: "date-desc" },
			);
		} else if (page === "users") {
			options.push(
				{
					label: t("common.sortOptions.recipesCountAsc"),
					value: "recipes-asc",
				},
				{
					label: t("common.sortOptions.recipesCountDesc"),
					value: "recipes-desc",
				},
			);
		}

		return options;
	}, [t, page]);
};
