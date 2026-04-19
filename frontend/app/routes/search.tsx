import { Filter, Sparks } from "iconoir-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { IconButton } from "~/components/buttons/IconButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { RecipeCard } from "~/components/cards/RecipeCard";
import { UserCard } from "~/components/cards/UserCard";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import { SortMenu } from "~/components/SortMenu";
import "~/assets/styles/recipesGrid.css";
import "~/assets/styles/usersGrid.css";
import "~/assets/styles/search.css";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useSortOptions } from "~/composables/useSortOptions";

const SEARCH_MAX_LIMIT = 5;
const DEFAULT_LIMIT = 5;
const LIMIT_OPTIONS = [5, 12, 24, 36, 48];

const parseLimit = (raw: string | null): number => {
	const parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed < 1) {
		return DEFAULT_LIMIT;
	}
	return Math.min(Math.trunc(parsed), SEARCH_MAX_LIMIT);
};

type SearchRecipesApiItem = {
	recipe_id: number;
	title: string;
	description: string | null;
};

type SearchRecipesApiResponse = {
	count: number;
	data: SearchRecipesApiItem[];
	summary?: string;
	summary_status?: string;
};

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
	| {
			type: "recipes";
			data: SearchRecipeItem[];
			total: number;
			summary?: string;
	  }
	| { type: "users"; data: SearchUserItem[]; total: number };

const SearchPage = () => {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	const query = searchParams.get("q") ?? "";
	const rawType = searchParams.get("type") ?? "recipes";
	const typeParam = rawType === "users" ? "users" : "recipes";
	const sort = searchParams.get("sort") ?? "";
	const limit = parseLimit(searchParams.get("limit"));
	const aiEnabled = searchParams.get("ai") !== "0";

	const sortOptions = useSortOptions(typeParam);

	const recipesTab = t("searchPage.recipesTab");
	const usersTab = t("searchPage.usersTab");
	const tabs = [recipesTab, usersTab];
	const activeTab = typeParam === "users" ? usersTab : recipesTab;

	const [results, setResults] = useState<SearchResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const total = results?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	useEffect(() => {
		if (!query) {
			setResults(null);
			setIsLoading(false);
			return;
		}

		if (typeParam === "users") {
			setResults({ type: "users", data: [], total: 0 });
			setIsLoading(false);
			return;
		}

		const params = new URLSearchParams({
			q: query,
			limit: String(limit),
		});

		setIsLoading(true);
		fetch(`${API_BASE_URL}/search/recipes?${params}`)
			.then(async (res) => {
				if (!res.ok) {
					return { count: 0, data: [] } as SearchRecipesApiResponse;
				}
				return (await res.json()) as SearchRecipesApiResponse;
			})
			.then((body) => {
				setResults({
					type: "recipes",
					total: body.count,
					summary: body.summary,
					data: body.data.map((item) => ({
						id: item.recipe_id,
						title: item.title,
						description: item.description ?? "",
						rating_avg: "",
					})),
				});
			})
			.catch(console.error)
			.finally(() => setIsLoading(false));
	}, [query, typeParam, limit]);

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

	const handleLimitChange = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("limit", value);
		params.delete("page");
		navigate(`/search?${params.toString()}`);
	};

	const handleAiToggle = () => {
		const params = new URLSearchParams(searchParams);
		if (aiEnabled) {
			params.set("ai", "0");
		} else {
			params.delete("ai");
		}
		navigate(`/search?${params.toString()}`);
	};

	const limitOptions = LIMIT_OPTIONS.map((n) => ({
		label: String(n),
		value: String(n),
	}));

	const totalLabel = query ? `${t("searchPage.totalCount")} ${total}` : "";

	return (
		<section className="search-page">
			<PageHeader title={t("searchPage.title")} totalLabel={totalLabel} />

			<div className="search-page__search-row">
				<SearchField
					key={query}
					defaultValue={query}
					onSubmit={handleSearch}
					placeholder={t("common.searchPlaceholder")}
				/>
				<IconButton
					type="button"
					className={`search-page__ai-toggle${aiEnabled ? " is-active" : ""}`}
					aria-pressed={aiEnabled}
					aria-label={
						aiEnabled
							? t("ariaLabels.disableAiSummary")
							: t("ariaLabels.enableAiSummary")
					}
					title={
						aiEnabled
							? t("searchPage.aiSummaryOn")
							: t("searchPage.aiSummaryOff")
					}
					onClick={handleAiToggle}
				>
					<Sparks aria-hidden />
				</IconButton>
			</div>

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

			{query && isLoading && (
				<p className="search-page__status">{t("searchPage.searching")}</p>
			)}

			{query && !isLoading && results && (
				<>
					{aiEnabled && results.type === "recipes" && results.summary && (
						<p className="search-page__summary">{results.summary}</p>
					)}

					{results.data.length === 0 ? (
						<p className="search-page__empty">{t("searchPage.noResults")}</p>
					) : results.type === "recipes" ? (
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

					{results.data.length > 0 && (
						<div className="search-page__pagination-row">
							<SortMenu
								options={limitOptions}
								value={String(limit)}
								onChange={handleLimitChange}
								label={`${t("searchPage.perPage")}: ${limit}`}
							/>
							<Pagination
								totalElementsCount={total}
								elementsPerPage={limit}
								totalPagesCount={totalPages}
							/>
						</div>
					)}
				</>
			)}
		</section>
	);
};

export default SearchPage;
