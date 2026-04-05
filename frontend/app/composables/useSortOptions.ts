import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SortOption } from "~/components/SortMenu";

export const useSortOptions = (page: "recipes" | "users"): SortOption[] => {
	const { t } = useTranslation();

	return useMemo(() => {
		if (page === "recipes") {
			return [
				{ label: t("common.sortOptions.titleAsc"), value: "name-asc" },
				{ label: t("common.sortOptions.titleDesc"), value: "name-desc" },
				{ label: t("common.sortOptions.dateAsc"), value: "date-asc" },
				{ label: t("common.sortOptions.dateDesc"), value: "date-desc" },
			];
		}

		return [
			{ label: t("common.sortOptions.nameAsc"), value: "name-asc" },
			{ label: t("common.sortOptions.nameDesc"), value: "name-desc" },
			{ label: t("common.sortOptions.recipesCountAsc"), value: "recipes-asc" },
			{
				label: t("common.sortOptions.recipesCountDesc"),
				value: "recipes-desc",
			},
		];
	}, [t, page]);
};
