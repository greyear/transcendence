import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { MainButton } from "~/components/buttons/MainButton";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useRelationSet } from "~/composables/useRelationSet";
import { FavoriteRecipesResponseSchema } from "~/schemas/favorites";

type RecipeCardResponse = {
	id: number;
	title: string;
	picture_url: string | null;
	description: string | null;
	rating_avg: number | null;
};

export const RecipesTabSchema = z.enum(["all", "my", "saved"]);
export type RecipesTab = z.infer<typeof RecipesTabSchema>;

type RecipesGridProps = {
	isAuthenticated: boolean;
	openAuthModal: (onSuccessAction?: () => void) => void;
	showNotice: (message: string) => void;
	sortValue?: string;
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
	userId?: number;
	favoritesOfUserId?: number;
	tab?: RecipesTab;
};

// Permissive shape that covers /recipes, /users/:id/recipes (both include
// picture_url and rating_avg) and /users/me/recipes (omits picture_url, may
// carry an extra `status` field). Missing optional fields normalize to null.
const RecipeListItemSchema = z
	.object({
		id: z.number(),
		title: z.string(),
		description: z.string().nullable(),
		rating_avg: z.coerce.number().nullable().optional(),
		picture_url: z.string().nullable().optional(),
	})
	.transform((row) => ({
		id: row.id,
		title: row.title,
		description: row.description,
		rating_avg: row.rating_avg ?? null,
		picture_url: row.picture_url ?? null,
	}));

const RecipeListResponseSchema = z.object({
	data: z.array(RecipeListItemSchema),
	total_count: z.number().int().nonnegative().optional(),
});

const tabRequiresAuth = (tab: RecipesTab): boolean =>
	tab === "my" || tab === "saved";

const resolveEndpoint = (
	favoritesOfUserId: number | undefined,
	userId: number | undefined,
	tab: RecipesTab,
): string => {
	if (favoritesOfUserId !== undefined) {
		return `${API_BASE_URL}/users/${favoritesOfUserId}/favorites`;
	}
	if (userId !== undefined) {
		return `${API_BASE_URL}/users/${userId}/recipes`;
	}
	if (tab === "my") {
		return `${API_BASE_URL}/users/me/recipes`;
	}
	if (tab === "saved") {
		return `${API_BASE_URL}/users/me/favorites`;
	}
	return `${API_BASE_URL}/recipes`;
};

const sortRecipes = (
	recipes: RecipeCardResponse[],
	sortValue: string,
): RecipeCardResponse[] => {
	const sorted = [...recipes];
	switch (sortValue) {
		case "name-asc":
			return sorted.sort((a, b) => a.title.localeCompare(b.title));
		case "name-desc":
			return sorted.sort((a, b) => b.title.localeCompare(a.title));
		default:
			return sorted;
	}
};

export const RecipesGrid = ({
	isAuthenticated,
	openAuthModal,
	showNotice,
	page = 1,
	perPage = 12,
	onLoad,
	sortValue = "",
	userId,
	favoritesOfUserId,
	tab = "all",
}: RecipesGridProps) => {
	const { t, i18n } = useTranslation();
	const language = i18n.resolvedLanguage ?? "en";
	const [recipeList, setRecipeList] = useState<RecipeCardResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<
		number | "unknown" | "auth-required" | null
	>(null);

	const {
		ids: favoriteIds,
		pendingIds: pendingFavoriteIds,
		isListLoading: isFavoritesLoading,
		handleToggle: handleFavoriteClick,
	} = useRelationSet({
		isAuthenticated,
		openAuthModal,
		listEndpoint: "/users/me/favorites",
		itemEndpoint: (recipeId) => `/recipes/${recipeId}/favorite`,
		onAlreadyMember: () => showNotice(t("notices.alreadyFavorited")),
	});

	// Resolution order: favoritesOfUserId > userId > tab. The first two pin the
	// list to a foreign subject; tabs are only viewer-scoped.
	const isScoped = favoritesOfUserId !== undefined || userId !== undefined;
	const isAuthGated =
		!isAuthenticated &&
		(favoritesOfUserId !== undefined || (!isScoped && tabRequiresAuth(tab)));
	// `/recipes` is the only paginated list endpoint — it returns a page slice
	// plus `total_count`. The other endpoints return every row, so the client
	// handles paging locally.
	const isServerPaginated = !isScoped && tab === "all";

	// Stash `onLoad` in a ref so an inline `(n) => ...` callback from a parent
	// doesn't retrigger the fetch effect on every render.
	const onLoadRef = useRef(onLoad);
	useEffect(() => {
		onLoadRef.current = onLoad;
	}, [onLoad]);

	// Only retrigger the fetch when sort changes for the server-paginated path;
	// for client-rendered tabs sort runs locally and doesn't need a refetch.
	const fetchSortValue = isServerPaginated ? sortValue : undefined;

	useEffect(() => {
		setErrorStatus(null);

		if (isAuthGated) {
			setRecipeList([]);
			onLoadRef.current?.(0);
			setIsLoading(false);
			setErrorStatus("auth-required");
			return;
		}

		setIsLoading(true);

		const baseEndpoint = resolveEndpoint(favoritesOfUserId, userId, tab);
		const sortParam = fetchSortValue
			? `&sort=${encodeURIComponent(fetchSortValue)}`
			: "";
		const endpoint = isServerPaginated
			? `${baseEndpoint}?page=${page}&per_page=${perPage}${sortParam}`
			: baseEndpoint;
		// /users/me/* and /users/:id/favorites require the auth cookie. The other
		// endpoints don't, but passing credentials is harmless — keep the original
		// no-credentials path for them to minimize surface area.
		const requiresCredentials =
			favoritesOfUserId !== undefined ||
			(userId === undefined && tabRequiresAuth(tab));
		const isFavoritesEndpoint =
			favoritesOfUserId !== undefined ||
			(userId === undefined && tab === "saved");

		fetch(endpoint, {
			headers: { "X-Language": language },
			...(requiresCredentials ? { credentials: "include" } : {}),
		})
			.then(async (res) => {
				if (!res.ok) {
					setErrorStatus(res.status);
					return null;
				}
				const body: unknown = await res.json();
				return body;
			})
			.then((body) => {
				if (body === null) {
					onLoadRef.current?.(0);
					setRecipeList([]);
					return;
				}

				let allRecipes: RecipeCardResponse[];

				if (isFavoritesEndpoint) {
					const parsed = FavoriteRecipesResponseSchema.safeParse(body);
					const rows = parsed.success ? parsed.data.data : [];
					allRecipes = rows.map((row) => ({
						id: row.id,
						title: row.title,
						description: row.description,
						picture_url: row.picture_url,
						rating_avg: null,
					}));
				} else {
					const parsed = RecipeListResponseSchema.safeParse(body);
					allRecipes = parsed.success ? parsed.data.data : [];
					if (isServerPaginated && parsed.success) {
						// Server tells us how many rows exist across all pages; the
						// array in `data` is just the current page slice.
						const total = parsed.data.total_count ?? allRecipes.length;
						onLoadRef.current?.(total);
						setRecipeList(allRecipes);
						return;
					}
				}

				onLoadRef.current?.(allRecipes.length);
				setRecipeList(allRecipes);
			})
			.catch((error: unknown) => {
				console.error(error);
				setErrorStatus("unknown");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [
		userId,
		favoritesOfUserId,
		tab,
		isAuthGated,
		language,
		isServerPaginated,
		page,
		perPage,
		fetchSortValue,
	]);

	const pageRecipes = isServerPaginated
		? recipeList
		: sortRecipes(recipeList, sortValue).slice(
				(page - 1) * perPage,
				(page - 1) * perPage + perPage,
			);

	if (isLoading) {
		return <p className="recipes-grid-status">{t("recipesGrid.loading")}</p>;
	}

	if (errorStatus === "auth-required") {
		return (
			<div className="recipes-grid-status">
				<p>{t("recipesGrid.signInRequired")}</p>
				<MainButton onClick={() => openAuthModal()}>
					{t("common.signInButton")}
				</MainButton>
			</div>
		);
	}

	if (errorStatus !== null) {
		if (favoritesOfUserId !== undefined && errorStatus === 403) {
			return (
				<p className="recipes-grid-status">
					{t("recipesGrid.favoritesForbidden")}
				</p>
			);
		}
		return (
			<p className="recipes-grid-status">
				{t("recipesGrid.error", { status: errorStatus })}
			</p>
		);
	}

	if (recipeList.length === 0) {
		return <p className="recipes-grid-status">{t("recipesGrid.empty")}</p>;
	}

	return (
		<ul className="recipe-card-list">
			{pageRecipes.map(
				({ id, title, description, rating_avg, picture_url }) => (
					<li key={id}>
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
	);
};
