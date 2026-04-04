import { Filter, Sort } from "iconoir-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import { RecipesGrid } from "~/components/RecipesGrid";
import { UsersGrid } from "~/components/UsersGrid";
import { getCurrentPage } from "~/composables/getCurrentPage";
import "~/assets/styles/search.css";

const PER_PAGE = 12;

const SearchPage = () => {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [totalCount, setTotalCount] = useState(0);

	const query = searchParams.get("q") ?? "";
	const typeParam = searchParams.get("type") ?? "recipes";
	const isUsers = typeParam === "users";

	const recipesTab = t("searchPage.recipesTab");
	const usersTab = t("searchPage.usersTab");
	const tabs = [recipesTab, usersTab];
	const activeTab = isUsers ? usersTab : recipesTab;

	const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
	const page = getCurrentPage(searchParams, totalPages);

	const handleSearch = (newQuery: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("q", newQuery);
		params.delete("page");
		navigate(`/search?${params.toString()}`);
	};

	const handleTabChange = (tab: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("type", tab === usersTab ? "users" : "recipes");
		params.delete("page");
		navigate(`/search?${params.toString()}`);
	};

	const totalLabel = query ? `${t("searchPage.totalCount")} ${totalCount}` : "";

	return (
		<section className="search-page">
			<PageHeader title={t("searchPage.title")} totalLabel={totalLabel} />

			<SearchField
				key={query}
				defaultValue={query}
				onSubmit={handleSearch}
				placeholder={t("common.searchPlaceholder")}
			/>

			<FilterList
				filters={tabs}
				activeFilter={activeTab}
				onFilterChange={handleTabChange}
			/>

			<div className="search-page-controls">
				<TextIconButton>
					{t("recipesPage.sortButton")}
					<Sort />
				</TextIconButton>

				<TextIconButton>
					{t("recipesPage.filterButton")}
					<Filter />
				</TextIconButton>
			</div>

			{isUsers ? (
				<UsersGrid key={`users-${query}`} />
			) : (
				<RecipesGrid
					key={`recipes-${query}`}
					page={page}
					perPage={PER_PAGE}
					onLoad={setTotalCount}
				/>
			)}

			{!isUsers && (
				<Pagination
					totalElementsCount={totalCount}
					elementsPerPage={PER_PAGE}
					totalPagesCount={totalPages}
				/>
			)}
		</section>
	);
};

export default SearchPage;
