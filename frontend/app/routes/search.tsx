import { Filter } from "iconoir-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { RecipeCard } from "~/components/cards/RecipeCard";
import { UserCard } from "~/components/cards/UserCard";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import { SortMenu } from "~/components/SortMenu";
import { getCurrentPage } from "~/composables/getCurrentPage";
import "~/assets/styles/recipesGrid.css";
import "~/assets/styles/usersGrid.css";
import "~/assets/styles/search.css";
import { useSortOptions } from "~/composables/useSortOptions";

const API_BASE = "http://localhost:3000";
const PER_PAGE = 12;

type SearchRecipeItem = {
	id: number;
	title: string;
	description: string;
	rating_avg: string;
};

type SearchUserItem = {
	id: number;
	name: string;
	recipeCount: number;
};

type SearchResponse =
	| { type: "recipes"; data: SearchRecipeItem[]; total: number }
	| { type: "users"; data: SearchUserItem[]; total: number };

const SearchPage = () => {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const query = searchParams.get("q") ?? "";
	const rawType = searchParams.get("type") ?? "recipes";
	const typeParam = rawType === "users" ? "users" : "recipes";
	const sort = searchParams.get("sort") ?? "";

	const sortOptions = useSortOptions(typeParam);

	const recipesTab = t("searchPage.recipesTab");
	const usersTab = t("searchPage.usersTab");
	const tabs = [recipesTab, usersTab];
	const activeTab = typeParam === "users" ? usersTab : recipesTab;

	const [results, setResults] = useState<SearchResponse | null>(null);

	const total = results?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
	const page = getCurrentPage(searchParams, totalPages);

	useEffect(() => {
		if (!query) {
			setResults(null);
			return;
		}

		const params = new URLSearchParams({
			q: query,
			type: typeParam,
			page: String(page),
			perPage: String(PER_PAGE),
			...(sort && { sort }),
		});

		fetch(`${API_BASE}/search?${params}`)
			.then((res) =>
				res.ok ? res.json() : { type: typeParam, data: [], total: 0 },
			)
			.then((body: SearchResponse) => setResults(body))
			.catch(console.error);
	}, [query, typeParam, page, sort]);

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
		params.delete("sort");
		navigate(`/search?${params.toString()}`);
	};

	const handleSortChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("sort", value);
		params.delete("page");
		navigate(`/search?${params.toString()}`);
	};

	const totalLabel = query ? `${t("searchPage.totalCount")} ${total}` : "";

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
				<SortMenu
					options={sortOptions}
					value={sort}
					onChange={handleSortChange}
				/>

				<TextIconButton>
					{t("common.filterButton")}
					<Filter />
				</TextIconButton>
			</div>

			{query && results && (
				<>
					{results.type === "recipes" ? (
						<ul className="recipe-card-list">
							{results.data.map(({ id, title, description, rating_avg }) => (
								<li key={id}>
									<RecipeCard
										id={id}
										title={title}
										description={description}
										rating={rating_avg}
									/>
								</li>
							))}
						</ul>
					) : (
						<ul className="user-card-list">
							{results.data.map(({ id, name, recipeCount }) => (
								<li key={id}>
									<UserCard id={id} name={name} recipeCount={recipeCount} />
								</li>
							))}
						</ul>
					)}

					<Pagination
						totalElementsCount={total}
						elementsPerPage={PER_PAGE}
						totalPagesCount={totalPages}
					/>
				</>
			)}
		</section>
	);
};

export default SearchPage;
