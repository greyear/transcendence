import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SortOption } from "~/components/SortMenu";

export const useSortOptions = (isRecipePage = false): SortOption[] => {
	const { t } = useTranslation();

	return useMemo(() => {
		const options: SortOption[] = [
			{ label: t("common.sortOptions.nameAsc"), value: "name-asc" },
			{ label: t("common.sortOptions.nameDesc"), value: "name-desc" },
		];

		if (isRecipePage) {
			options.push(
				{ label: t("common.sortOptions.dateAsc"), value: "date-asc" },
				{ label: t("common.sortOptions.dateDesc"), value: "date-desc" },
			);
		}

		return options;
	}, [t, isRecipePage]);
};
