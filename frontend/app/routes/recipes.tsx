import { useState } from "react";
import { useSearchParams } from "react-router";
import { MainButton } from "~/components/buttons/MainButton";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import { RecipesGrid } from "~/components/RecipesGrid";
import "~/assets/styles/recipes.css";
import { Filter } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SortMenu, type SortOption } from "~/components/SortMenu";
import { getCurrentPage } from "~/composables/getCurrentPage";
import { useSortParam } from "~/composables/useSortParam";

const PER_PAGE = 12;

const RecipesPage = () => {
	const { t } = useTranslation();
	const [activeFilterIndex, setActiveFilterIndex] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [searchParams] = useSearchParams();

	const SORT_OPTIONS: SortOption[] = [
		{ label: t("recipesPage.sortOptions.nameAsc"), value: "name-asc" },
		{ label: t("recipesPage.sortOptions.nameDesc"), value: "name-desc" },
		// { label: t("recipesPage.sortOptions.dateAsc"), value: "date-asc" }
		// { label: t("recipesPage.sortOptions.dateDesc"), value: "date-desc" },
	];

	const DEFAULT_SORT = SORT_OPTIONS[0].value;

	const [sortValue, setSort] = useSortParam(DEFAULT_SORT);

	const filters = [
		t("recipesPage.tabAll"),
		t("recipesPage.tabMy"),
		t("recipesPage.tabSaved"),
	];
	const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
	const page = getCurrentPage(searchParams, totalPages);

	return (
		<section className="recipes-page">
			<PageHeader
				title={t("recipesPage.title")}
				totalLabel={`${t("recipesPage.totalCount")} ${totalCount}`}
				action={<MainButton>{t("recipesPage.createButton")}</MainButton>}
			/>

			<SearchField placeholder={t("common.searchPlaceholder")} />

			<FilterList
				filters={filters}
				activeFilter={filters[activeFilterIndex]}
				onFilterChange={(filter) =>
					setActiveFilterIndex(filters.indexOf(filter))
				}
			/>

			<div className="recipes-page-controls">
				<SortMenu options={SORT_OPTIONS} value={sortValue} onChange={setSort} />

				<TextIconButton>
					{t("common.filterButton")}
					<Filter />
				</TextIconButton>
			</div>

			<RecipesGrid
				page={page}
				perPage={PER_PAGE}
				onLoad={setTotalCount}
				sortValue={sortValue}
			/>

			<Pagination
				totalElementsCount={totalCount}
				elementsPerPage={PER_PAGE}
				totalPagesCount={totalPages}
			/>
		</section>
	);
};

export default RecipesPage;
