import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MainButton } from "~/components/buttons/MainButton";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import {
	RecipesGrid,
	type RecipesTab,
	RecipesTabSchema,
} from "~/components/RecipesGrid";
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
	const { isAuthenticated, openAuthModal, showNotice } =
		useOutletContext<LayoutOutletContext>();
	const [totalCount, setTotalCount] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	const handleSearch = (q: string) => {
		const params = new URLSearchParams({ q, type: "recipes" });
		navigate(`/search?${params.toString()}`);
	};

	const sortOptions = useSortOptions("recipes");
	const DEFAULT_SORT = sortOptions[0].value;

	const [sortValue, setSort] = useSortParam(DEFAULT_SORT);

	// `tab` lives in the URL so it's shareable, refresh-safe, and survives
	// re-renders from sibling URL params (sort, page).
	const parsedTab = RecipesTabSchema.safeParse(searchParams.get("tab"));
	const tab: RecipesTab = parsedTab.success ? parsedTab.data : "all";

	const tabsConfig = useMemo((): { value: RecipesTab; label: string }[] => {
		const all = [
			{ value: "all" as const, label: t("recipesPage.tabAll") },
			{ value: "my" as const, label: t("recipesPage.tabMy") },
			{ value: "saved" as const, label: t("recipesPage.tabSaved") },
		];
		// Hide auth-only tabs for guests so they can't reach a state the grid
		// would have to refuse to render. Direct URL hits to ?tab=my still get
		// the in-grid sign-in prompt.
		return isAuthenticated ? all : all.filter((entry) => entry.value === "all");
	}, [t, isAuthenticated]);

	const filterLabels = useMemo(
		() => tabsConfig.map((entry) => entry.label),
		[tabsConfig],
	);

	const activeLabel =
		tabsConfig.find((entry) => entry.value === tab)?.label ??
		tabsConfig[0].label;

	const handleTabChange = (label: string) => {
		const next = tabsConfig.find((entry) => entry.label === label);
		if (!next) {
			return;
		}
		setSearchParams(
			(prev) => {
				const params = new URLSearchParams(prev);
				if (next.value === "all") {
					params.delete("tab");
				} else {
					params.set("tab", next.value);
				}
				params.delete("page");
				return params;
			},
			{ replace: true },
		);
	};

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
				filters={filterLabels}
				activeFilter={activeLabel}
				onFilterChange={handleTabChange}
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
				showNotice={showNotice}
				tab={tab}
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
