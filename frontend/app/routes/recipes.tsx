import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MainButton } from "~/components/buttons/MainButton";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import { RecipesGrid } from "~/components/RecipesGrid";
import "~/assets/styles/recipes.css";
import { Filter } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SortMenu } from "~/components/SortMenu";
import { getCurrentPage } from "~/composables/getCurrentPage";
import { useSortOptions } from "~/composables/useSortOptions";
import { useSortParam } from "~/composables/useSortParam";
import type { LayoutOutletContext } from "~/layouts/layout";

const PER_PAGE = 12;

const RecipesPage = () => {
	const { t } = useTranslation();
	const { isAuthenticated, openAuthModal } =
		useOutletContext<LayoutOutletContext>();
	const [activeFilterIndex, setActiveFilterIndex] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const handleSearch = (q: string) => {
		const params = new URLSearchParams({ q, type: "recipes" });
		navigate(`/search?${params.toString()}`);
	};

	const sortOptions = useSortOptions("recipes");
	const DEFAULT_SORT = sortOptions[0].value;

	const [sortValue, setSort] = useSortParam(DEFAULT_SORT);

	const filters = useMemo(
		() => [
			t("recipesPage.tabAll"),
			t("recipesPage.tabMy"),
			t("recipesPage.tabSaved"),
		],
		[t],
	);
	const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
	const page = getCurrentPage(searchParams, totalPages);

	return (
		<section className="recipes-page">
			<PageHeader
				title={t("recipesPage.title")}
				totalLabel={`${t("recipesPage.totalCount")} ${totalCount}`}
				action={
					<MainButton to="/recipes/create">
						{t("recipesPage.createButton")}
					</MainButton>
				}
			/>

			<SearchField
				placeholder={t("common.searchPlaceholder")}
				onSubmit={handleSearch}
			/>

			<FilterList
				filters={filters}
				activeFilter={filters[activeFilterIndex]}
				onFilterChange={(filter) =>
					setActiveFilterIndex(filters.indexOf(filter))
				}
			/>

			<div className="recipes-page-controls">
				<SortMenu options={sortOptions} value={sortValue} onChange={setSort} />

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
				isAuthenticated={isAuthenticated}
				openAuthModal={openAuthModal}
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
