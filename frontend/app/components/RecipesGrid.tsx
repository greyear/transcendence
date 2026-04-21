import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useRelationSet } from "~/composables/useRelationSet";

type RecipeCardResponse = {
	id: number;
	title: string;
	picture_url: string | null;
	description: string | null;
	rating_avg: number | null;
	// created_at: string;
};

type RecipesGridProps = {
	isAuthenticated: boolean;
	openAuthModal: (onSuccessAction?: () => void) => void;
	sortValue?: string;
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
	sort?: "top";
	userId?: number;
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
		// case "date-asc":
		// 	return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
		// case "date-desc":
		// 	return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
		default:
			return sorted;
	}
};

export const RecipesGrid = ({
	isAuthenticated,
	openAuthModal,
	page = 1,
	perPage = 12,
	onLoad,
	sort,
	sortValue = "",
	userId,
}: RecipesGridProps) => {
	const { t } = useTranslation();
	const [recipeList, setRecipeList] = useState<RecipeCardResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

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
	});

	useEffect(() => {
		setIsLoading(true);
		setErrorStatus(null);

		const endpoint =
			userId !== undefined
				? `${API_BASE_URL}/users/${userId}/recipes`
				: `${API_BASE_URL}/recipes`;
		fetch(endpoint)
			.then((res) => {
				if (!res.ok) {
					setErrorStatus(res.status);
					return { data: [] };
				}
				return res.json();
			})
			.then((body) => {
				let allRecipes: RecipeCardResponse[] = body.data ?? [];

				if (sort === "top") {
					allRecipes = [...allRecipes].sort(
						(a, b) => (b.rating_avg ?? 0) - (a.rating_avg ?? 0),
					);
				}
				onLoad?.(allRecipes.length);
				setRecipeList(allRecipes);
			})
			.catch((error: unknown) => {
				console.error(error);
				setErrorStatus("unknown");
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [onLoad, sort, userId]);

	const sortedList = useMemo(
		() => sortRecipes(recipeList, sortValue),
		[recipeList, sortValue],
	);

	const start = (page - 1) * perPage;
	const pageRecipes = sortedList.slice(start, start + perPage);

	if (isLoading) {
		return <p className="recipes-grid-status">{t("recipesGrid.loading")}</p>;
	}

	if (errorStatus !== null) {
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
