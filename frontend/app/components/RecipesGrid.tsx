import { RecipeCard } from "./cards/RecipeCard";
import "../assets/styles/recipesGrid.css";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

type RecipeCardResponse = {
	id: number;
	title: string;
	picture_url: string | null;
	description: string | null;
	rating_avg: number | null;
	// created_at: string;
};

type RecipesGridProps = {
	sortValue?: string;
	page?: number;
	perPage?: number;
	onLoad?: (totalCount: number) => void;
	sort?: "top";
	isAuthenticated: boolean;
	openAuthModal: (onSuccessAction?: () => void) => void;
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
	page = 1,
	perPage = 12,
	onLoad,
	sort,
	sortValue = "",
	isAuthenticated,
	openAuthModal,
}: RecipesGridProps) => {
	const { t } = useTranslation();
	const [recipeList, setRecipeList] = useState<RecipeCardResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(
		new Set(),
	);

	useEffect(() => {
		setIsLoading(true);
		setErrorStatus(null);

		fetch(`${API_BASE_URL}/recipes`)
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
	}, [onLoad, sort]);

	useEffect(() => {
		if (!isAuthenticated) {
			setFavoriteIds(new Set());
			return;
		}

		fetch(`${API_BASE_URL}/users/me/favorites`, {
			credentials: "include",
		})
			.then((res) => {
				if (!res.ok) {
					return null;
				}
				return res.json();
			})
			.then((body) => {
				const favorites = body?.data ?? [];
				const ids = new Set<number>(
					favorites
						.map((favorite: { id: number }) => favorite.id)
						.filter((id: unknown): id is number => typeof id === "number"),
				);
				setFavoriteIds(ids);
			})
			.catch((error) => {
				console.error(error);
				setFavoriteIds(new Set());
			});
	}, [isAuthenticated]);

	const toggleFavorite = async (recipeId: number) => {
		if (pendingFavoriteIds.has(recipeId)) {
			return;
		}

		const wasFavorited = favoriteIds.has(recipeId);
		const shouldBeFavorited = !wasFavorited;

		setFavoriteIds((prev) => {
			const next = new Set(prev);
			if (shouldBeFavorited) {
				next.add(recipeId);
			} else {
				next.delete(recipeId);
			}
			return next;
		});

		setPendingFavoriteIds((prev) => new Set(prev).add(recipeId));

		try {
			const response = await fetch(
				`${API_BASE_URL}/recipes/${recipeId}/favorite`,
				{
					method: shouldBeFavorited ? "POST" : "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				setFavoriteIds((prev) => {
					const next = new Set(prev);
					if (wasFavorited) {
						next.add(recipeId);
					} else {
						next.delete(recipeId);
					}
					return next;
				});
			}
		} catch (error) {
			console.error(error);
			setFavoriteIds((prev) => {
				const next = new Set(prev);
				if (wasFavorited) {
					next.add(recipeId);
				} else {
					next.delete(recipeId);
				}
				return next;
			});
		} finally {
			setPendingFavoriteIds((prev) => {
				const next = new Set(prev);
				next.delete(recipeId);
				return next;
			});
		}
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
			{pageRecipes.map(({ id, title, description, rating_avg, picture_url}) => (
				<li key={id}>
					<RecipeCard
						id={id}
						title={title}
						description={description}
						rating={rating_avg}
						pictureUrl={picture_url}
						isFavorited={favoriteIds.has(id)}
						isFavoritePending={pendingFavoriteIds.has(id)}
						onFavoriteClick={handleFavoriteClick}
					/>
				</li>
			))}
		</ul>
	);
};
