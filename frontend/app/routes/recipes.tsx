import { NavArrowLeft } from "iconoir-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Navigate,
	useNavigate,
	useOutletContext,
	useSearchParams,
} from "react-router";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import {
	CategoryFilterMenu,
	type SearchFilterValues,
} from "~/components/CategoryFilterMenu";
import { FilterList } from "~/components/FilterList";
import { SearchField } from "~/components/inputs/SearchField";
import { PageHeader } from "~/components/PageHeader";
import { Pagination } from "~/components/pagination/Pagination";
import {
	RecipesGrid,
	type RecipesTab,
	RecipesTabSchema,
} from "~/components/RecipesGrid";
import { CATEGORY_TYPE_CODES } from "~/components/recipe/RecipeCategorySection";
import "~/assets/styles/recipes.scss";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { SortMenu } from "~/components/SortMenu";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { getCurrentPage } from "~/composables/getCurrentPage";
import { useCategoryMap } from "~/composables/useCategoryMap";
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import {
	PER_PAGE_OPTIONS,
	usePerPageParam,
} from "~/composables/usePerPageParam";
import { useSortOptions } from "~/composables/useSortOptions";
import { useSortParam } from "~/composables/useSortParam";
import i18next from "~/i18next.server";
import type { LayoutOutletContext } from "~/layouts/layout";
import type { Route } from "./+types/recipes";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const t = await i18next.getFixedT(request);
	return {
		meta: {
			title: t("pageTitles.recipes"),
			description: t("pageDescriptions.recipes"),
		},
	};
};

export const meta: Route.MetaFunction = ({ data }) => [
	{ title: data?.meta.title },
	{ name: "description", content: data?.meta.description },
];

const FILTER_PARAM_BY_TYPE: Record<string, string> = {
	meal_time: "mealType",
	dish_type: "dishType",
	main_ingredient: "mainIngredient",
	cuisine: "cuisine",
};

const PER_PAGE_MENU_OPTIONS = PER_PAGE_OPTIONS.map((n) => ({
	label: String(n),
	value: String(n),
}));

const TAB_LABEL_KEYS: Record<RecipesTab, string> = {
	all: "recipesPage.tabAll",
	my: "recipesPage.tabMy",
	saved: "recipesPage.tabSaved",
};

const AUTH_REQUIRED_TABS: ReadonlySet<RecipesTab> = new Set(["my", "saved"]);

const parsePositiveInt = (value: string | null): number | null => {
	if (value === null) {
		return null;
	}
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : null;
};

const ScopedUserResponseSchema = z.object({
	data: z.object({
		id: z.number(),
		username: z.string(),
		is_mutual_follower: z.boolean().default(false),
	}),
});

type ScopedMode = "authoredBy" | "favoritesOf" | "global";

const RecipesPage = () => {
	const { t } = useTranslation();
	const {
		isAuthenticated,
		isAuthResolved,
		currentUserId,
		openAuthModal,
		showNotice,
	} = useOutletContext<LayoutOutletContext>();
	const [totalCount, setTotalCount] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	const scopedUserId = parsePositiveInt(searchParams.get("userId"));
	const scopedFavoritesOf = parsePositiveInt(searchParams.get("favoritesOf"));

	// Mutually exclusive — favoritesOf wins if both are somehow present.
	const mode: ScopedMode =
		scopedFavoritesOf !== null
			? "favoritesOf"
			: scopedUserId !== null
				? "authoredBy"
				: "global";
	const isScoped = mode !== "global";
	const scopedSubjectId =
		mode === "favoritesOf" ? scopedFavoritesOf : scopedUserId;

	const [scopedUsername, setScopedUsername] = useState<string | null>(null);
	const [isMutualFollower, setIsMutualFollower] = useState<boolean | null>(
		null,
	);

	useEffect(() => {
		if (scopedSubjectId === null) {
			setScopedUsername(null);
			setIsMutualFollower(null);
			return;
		}
		let ignore = false;
		fetch(`${API_BASE_URL}/users/${scopedSubjectId}`, {
			credentials: "include",
		})
			.then(async (res) => {
				if (!res.ok) {
					return null;
				}
				const body: unknown = await res.json();
				const parsed = ScopedUserResponseSchema.safeParse(body);
				return parsed.success ? parsed.data.data : null;
			})
			.then((userData) => {
				if (!ignore) {
					setScopedUsername(userData?.username ?? null);
					setIsMutualFollower(userData?.is_mutual_follower ?? false);
				}
			})
			.catch(() => {
				if (!ignore) {
					setScopedUsername(null);
					setIsMutualFollower(false);
				}
			});
		return () => {
			ignore = true;
		};
	}, [scopedSubjectId]);

	const handleSearch = (q: string) => {
		const params = new URLSearchParams({ q, type: "recipes" });
		navigate(`/search?${params.toString()}`);
	};

	const categories = useCategoryMap();
	const sortOptions = useSortOptions("recipes");
	const DEFAULT_SORT = sortOptions[0].value;

	const [sortValue, setSort] = useSortParam(DEFAULT_SORT);
	const [perPage, setPerPage] = usePerPageParam();

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
	const filterValues = useMemo<SearchFilterValues>(
		() => ({
			meal_time: mealTypeFilters,
			dish_type: dishTypeFilters,
			main_ingredient: mainIngredientFilters,
			cuisine: cuisineFilters,
		}),
		[mealTypeFilters, dishTypeFilters, mainIngredientFilters, cuisineFilters],
	);

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

	// `tab` lives in the URL so it's shareable, refresh-safe, and survives
	// re-renders from sibling URL params (sort, page).
	const parsedTab = RecipesTabSchema.safeParse(searchParams.get("tab"));
	const requestedTab: RecipesTab = parsedTab.success ? parsedTab.data : "all";
	// Guests hitting ?tab=my via a bookmark shouldn't see FilterList highlight
	// "All" while the grid renders a sign-in gate for "my" — collapse both to
	// "all" so the UI stays coherent. Once they sign in, the URL still carries
	// ?tab=my and the intent is restored.
	const tab: RecipesTab =
		!isAuthenticated && AUTH_REQUIRED_TABS.has(requestedTab)
			? "all"
			: requestedTab;

	// Inline: the tab bar is only rendered for authenticated users, so
	// skipping these allocations for guests is cheap and keeps the hook list
	// above small. All three of `tabsConfig`, the label list, and the
	// onFilterChange handler live inside `renderTabBar` because none of them
	// are used anywhere else.
	const renderTabBar = () => {
		const tabsConfig = RecipesTabSchema.options.map((value) => ({
			value,
			label: t(TAB_LABEL_KEYS[value]),
		}));
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
						for (const typeCode of CATEGORY_TYPE_CODES) {
							params.delete(FILTER_PARAM_BY_TYPE[typeCode]);
						}
					}
					params.delete("page");
					return params;
				},
				{ replace: true },
			);
		};
		return (
			<FilterList
				filters={tabsConfig.map((entry) => entry.label)}
				activeFilter={t(TAB_LABEL_KEYS[tab])}
				onFilterChange={handleTabChange}
				ariaLabel={t("ariaLabels.recipesFilter")}
			/>
		);
	};

	const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
	const page = getCurrentPage(searchParams, totalPages);

	const documentTitle =
		mode === "favoritesOf" && scopedUsername
			? t("pageTitles.recipesFavoritesOf", { username: scopedUsername })
			: mode === "authoredBy" && scopedUsername
				? t("pageTitles.recipesAuthoredBy", { username: scopedUsername })
				: t("pageTitles.recipes");
	useDocumentTitle(documentTitle);

	// Self-favorites has no audience: the backend always 403s (you can't be a
	// mutual follower of yourself). Send the viewer to their own profile —
	// but wait for auth to resolve, otherwise the grid fires /favorites and
	// flashes the 403 message to the owner before the redirect lands.
	if (
		mode === "favoritesOf" &&
		isAuthResolved &&
		currentUserId !== null &&
		scopedFavoritesOf === currentUserId
	) {
		return <Navigate to="/profile" replace />;
	}

	const title =
		mode === "favoritesOf" && scopedUsername
			? t("recipesPage.titleFavoritesOf", { username: scopedUsername })
			: mode === "authoredBy" && scopedUsername
				? t("recipesPage.titleAuthoredBy", { username: scopedUsername })
				: t("recipesPage.title");

	return (
		<section className="recipes-page">
			{isScoped && scopedSubjectId !== null ? (
				<TextIconButton to={`/user/${scopedSubjectId}`} className="text-body2">
					<NavArrowLeft aria-hidden="true" />
					{t("recipesPage.backToProfile")}
				</TextIconButton>
			) : null}

			<PageHeader
				title={title}
				totalLabel={`${t("recipesPage.totalCount")} ${totalCount}`}
				action={
					isScoped ? undefined : (
						<MainButton to="/recipes/create">
							{t("recipesPage.createButton")}
						</MainButton>
					)
				}
			/>

			<SearchField
				placeholder={t("common.searchPlaceholder")}
				onSubmit={handleSearch}
			/>

			{!isScoped && isAuthenticated ? renderTabBar() : null}

			<div className="recipes-page-controls">
				<SortMenu options={sortOptions} value={sortValue} onChange={setSort} />

				{!isScoped && tab === "all" && (
					<CategoryFilterMenu
						categories={categories}
						values={filterValues}
						onApply={handleFilterApply}
					/>
				)}
			</div>

			{mode === "favoritesOf" &&
			(!isAuthResolved || isMutualFollower === null) ? (
				<p className="recipes-grid-status">{t("recipesGrid.loading")}</p>
			) : (
				<RecipesGrid
					page={page}
					perPage={perPage}
					onLoad={setTotalCount}
					sortValue={sortValue}
					filters={filterValues}
					isAuthenticated={isAuthenticated}
					openAuthModal={openAuthModal}
					showNotice={showNotice}
					tab={tab}
					userId={
						mode === "authoredBy" ? (scopedUserId ?? undefined) : undefined
					}
					favoritesOfUserId={
						mode === "favoritesOf"
							? (scopedFavoritesOf ?? undefined)
							: undefined
					}
					canViewFavorites={
						mode === "favoritesOf" ? (isMutualFollower ?? undefined) : undefined
					}
				/>
			)}

			<div className="pagination-row">
				<SortMenu
					options={PER_PAGE_MENU_OPTIONS}
					value={String(perPage)}
					onChange={(value) => setPerPage(Number(value))}
					label={`${t("common.perPage")}: ${perPage}`}
				/>
				<Pagination
					totalElementsCount={totalCount}
					elementsPerPage={perPage}
					totalPagesCount={totalPages}
				/>
			</div>
		</section>
	);
};

export default RecipesPage;
