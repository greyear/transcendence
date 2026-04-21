import { Sparks } from "iconoir-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useSearchParams } from "react-router";
import { z } from "zod";
import { IconButton } from "~/components/buttons/IconButton";
import { RecipeCard } from "~/components/cards/RecipeCard";
import { UserCard } from "~/components/cards/UserCard";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import {
	CATEGORY_TYPE_CODES,
	type CategoryTypeCode,
} from "~/components/recipe/RecipeCategorySection";
import {
	SearchFilterMenu,
	type SearchFilterValues,
} from "~/components/SearchFilterMenu";
import { SortMenu } from "~/components/SortMenu";
import type { LayoutOutletContext } from "~/layouts/layout";
import "~/assets/styles/recipesGrid.css";
import "~/assets/styles/usersGrid.css";
import "~/assets/styles/search.css";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useCategoryMap } from "~/composables/useCategoryMap";
import { useFavoriteRecipes } from "~/composables/useFavoriteRecipes";
import { useSortOptions } from "~/composables/useSortOptions";

const FILTER_PARAM_BY_TYPE: Record<CategoryTypeCode, string> = {
	meal_time: "mealType",
	dish_type: "dishType",
	main_ingredient: "mainIngredient",
	cuisine: "cuisine",
};

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

const SearchRecipesApiItemSchema = z.object({
	recipe_id: z.number(),
	title: z.string(),
	description: z.string().nullable(),
	rating_avg: z.number().nullable().optional(),
	picture_url: z.string().nullable().optional(),
});

const SearchRecipesApiResponseSchema = z.object({
	count: z.number(),
	data: z.array(SearchRecipesApiItemSchema),
	summary: z.string().optional(),
	summary_status: z.string().optional(),
});

type SearchRecipeItem = {
	id: number;
	title: string;
	description: string | null;
	rating_avg: number | null;
	picture_url: string | null;
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
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const { isAuthenticated, openAuthModal } =
		useOutletContext<LayoutOutletContext>();
	const categories = useCategoryMap();
	const {
		favoriteIds,
		pendingFavoriteIds,
		isFavoritesLoading,
		toggleFavorite,
	} = useFavoriteRecipes(isAuthenticated);

	const query = searchParams.get("q") ?? "";
	const rawType = searchParams.get("type") ?? "recipes";
	const typeParam = rawType === "users" ? "users" : "recipes";
	const sort = searchParams.get("sort") ?? "";
	const limit = parseLimit(searchParams.get("limit"));
	const aiEnabled = searchParams.get("ai") !== "0";

	const rawPage = Number(searchParams.get("page") ?? "1");
	const page =
		Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;

	const mealTypeFilters = useMemo(
		() => searchParams.getAll("mealType"),
		[searchParams],
	);
	const dishTypeFilters = useMemo(
		() => searchParams.getAll("dishType"),
		[searchParams],
	);
	const mainIngredientFilters = useMemo(
		() => searchParams.getAll("mainIngredient"),
		[searchParams],
	);
	const cuisineFilters = useMemo(
		() => searchParams.getAll("cuisine"),
		[searchParams],
	);

	const filterValues = useMemo(
		() => ({
			meal_time: mealTypeFilters,
			dish_type: dishTypeFilters,
			main_ingredient: mainIngredientFilters,
			cuisine: cuisineFilters,
		}),
		[mealTypeFilters, dishTypeFilters, mainIngredientFilters, cuisineFilters],
	);

	const sortOptions = useSortOptions(typeParam);

	const recipesTab = t("searchPage.recipesTab");
	const usersTab = t("searchPage.usersTab");
	const tabs = [recipesTab, usersTab];
	const activeTab = typeParam === "users" ? usersTab : recipesTab;

	const [results, setResults] = useState<SearchResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [hasError, setHasError] = useState(false);

	const total = results?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / limit));

	useEffect(() => {
		if (!query) {
			setResults(null);
			setIsLoading(false);
			setHasError(false);
			return;
		}

		const controller = new AbortController();

		const params = new URLSearchParams();
		params.set("q", query);
		params.set("type", typeParam);
		params.set("limit", String(limit));
		params.set("page", String(page));
		const effectiveAi = typeParam === "recipes" && aiEnabled;
		params.set("ai", effectiveAi ? "1" : "0");
		if (sort) {
			params.set("sort", sort);
		}
		for (const code of mealTypeFilters) {
			params.append("mealType", code);
		}
		for (const code of dishTypeFilters) {
			params.append("dishType", code);
		}
		for (const code of mainIngredientFilters) {
			params.append("mainIngredient", code);
		}
		for (const code of cuisineFilters) {
			params.append("cuisine", code);
		}

		setIsLoading(true);
		setHasError(false);
		fetch(`${API_BASE_URL}/search/recipes?${params}`, {
			signal: controller.signal,
		})
			.then(async (res) => {
				if (!res.ok) {
					console.error(`Failed to search recipes: ${res.status}`);
					return null;
				}
				return res.json();
			})
			.then((body) => {
				if (body === null) {
					setResults(null);
					setHasError(true);
					return;
				}
				const parsed = SearchRecipesApiResponseSchema.safeParse(body);
				if (!parsed.success) {
					console.error(
						"Unexpected /search/recipes response shape",
						parsed.error,
					);
					setResults(null);
					setHasError(true);
					return;
				}
				setResults({
					type: "recipes",
					total: parsed.data.count,
					summary: parsed.data.summary,
					data: parsed.data.data.map((item) => ({
						id: item.recipe_id,
						title: item.title,
						description: item.description,
						rating_avg: item.rating_avg ?? null,
						picture_url: item.picture_url ?? null,
					})),
				});
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
				console.error(error);
				setResults(null);
				setHasError(true);
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			});

		return () => {
			controller.abort();
		};
	}, [
		query,
		typeParam,
		limit,
		page,
		sort,
		aiEnabled,
		mealTypeFilters,
		dishTypeFilters,
		mainIngredientFilters,
		cuisineFilters,
	]);

	const handleSearch = (newQuery: string) => {
		const params = new URLSearchParams(searchParams);
		params.set("q", newQuery);
		params.delete("page");
		navigate(`/search?${params.toString()}`);
	};

	const handleTabChange = (tab: string) => {
		const nextType = tab === usersTab ? "users" : "recipes";
		const params = new URLSearchParams(searchParams);
		params.set("type", nextType);
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

	const handleFavoriteClick = (recipeId: number) => {
		if (!isAuthenticated) {
			openAuthModal(() => {
				void toggleFavorite(recipeId);
			});
			return;
		}

		void toggleFavorite(recipeId);
	};

	const handleFilterApply = (applied: SearchFilterValues) => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				for (const typeCode of CATEGORY_TYPE_CODES) {
					const paramKey = FILTER_PARAM_BY_TYPE[typeCode];
					next.delete(paramKey);
					for (const code of applied[typeCode]) {
						next.append(paramKey, code);
					}
				}
				next.delete("page");
				return next;
			},
			{ replace: true },
		);
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
				{typeParam === "recipes" && (
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
				)}
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

				{typeParam === "recipes" && (
					<SearchFilterMenu
						categories={categories}
						values={filterValues}
						onApply={handleFilterApply}
					/>
				)}
			</div>

			{query && isLoading && (
				<p className="search-page__status">{t("searchPage.searching")}</p>
			)}

			{query && !isLoading && hasError && (
				<p className="search-page__status">{t("searchPage.error")}</p>
			)}

			{query && !isLoading && !hasError && results && (
				<>
					{aiEnabled && results.type === "recipes" && results.summary && (
						<p className="search-page__summary">{results.summary}</p>
					)}

					{results.data.length === 0 ? (
						<p className="search-page__empty">{t("searchPage.noResults")}</p>
					) : results.type === "recipes" ? (
						<ul className="recipe-card-list">
							{results.data.map(
								({ id, title, description, rating_avg, picture_url }) => (
									<li key={id}>
										{/* TODO(favorites-owner): wire isFavorited + onFavoriteClick
									    to the viewer's /users/me/favorites state so the star
									    reflects and mutates the real favorite set. */}
										<RecipeCard
											id={id}
											title={title}
											description={description}
											rating={rating_avg}
											pictureUrl={picture_url}
											isFavorited={favoriteIds.has(id)}
											isFavoritePending={
												isFavoritesLoading || pendingFavoriteIds.has(id)
											}
											onFavoriteClick={handleFavoriteClick}
										/>
									</li>
								),
							)}
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
