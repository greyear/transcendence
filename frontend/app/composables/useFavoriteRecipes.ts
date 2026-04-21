import { useEffect, useState } from "react";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { FavoriteRecipesResponseSchema } from "~/schemas/favorites";

const getFavoriteIds = (body: unknown): Set<number> => {
	const parsed = FavoriteRecipesResponseSchema.safeParse(body);
	if (!parsed.success) {
		return new Set();
	}
	return new Set(parsed.data.data.map((favorite) => favorite.id));
};

const updateFavoriteIds = (
	currentFavoriteIds: Set<number>,
	recipeId: number,
	shouldBeFavorited: boolean,
): Set<number> => {
	const next = new Set(currentFavoriteIds);
	if (shouldBeFavorited) {
		next.add(recipeId);
	} else {
		next.delete(recipeId);
	}
	return next;
};

export type UseFavoriteRecipes = {
	favoriteIds: Set<number>;
	pendingFavoriteIds: Set<number>;
	isFavoritesLoading: boolean;
	toggleFavorite: (recipeId: number) => Promise<void>;
};

export const useFavoriteRecipes = (
	isAuthenticated: boolean,
): UseFavoriteRecipes => {
	const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(
		new Set(),
	);
	const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);

	useEffect(() => {
		if (!isAuthenticated) {
			setFavoriteIds(new Set());
			setIsFavoritesLoading(false);
			return;
		}

		setIsFavoritesLoading(true);

		fetch(`${API_BASE_URL}/users/me/favorites`, {
			credentials: "include",
		})
			.then((res) => {
				if (!res.ok) {
					return null;
				}
				return res.json();
			})
			.then((body: unknown) => {
				setFavoriteIds(getFavoriteIds(body));
			})
			.catch((error) => {
				console.error(error);
				setFavoriteIds(new Set());
			})
			.finally(() => {
				setIsFavoritesLoading(false);
			});
	}, [isAuthenticated]);

	const toggleFavorite = async (recipeId: number) => {
		if (pendingFavoriteIds.has(recipeId)) {
			return;
		}

		const wasFavoritedBeforeClick = favoriteIds.has(recipeId);
		const shouldBeFavorited = !wasFavoritedBeforeClick;

		setFavoriteIds((prev) =>
			updateFavoriteIds(prev, recipeId, shouldBeFavorited),
		);
		setPendingFavoriteIds((prev) => new Set(prev).add(recipeId));

		try {
			const response = await fetch(
				`${API_BASE_URL}/recipes/${recipeId}/favorite`,
				{
					method: shouldBeFavorited ? "POST" : "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok && response.status !== 409) {
				setFavoriteIds((prev) =>
					updateFavoriteIds(prev, recipeId, wasFavoritedBeforeClick),
				);
			}
		} catch (error) {
			console.error(error);
			setFavoriteIds((prev) =>
				updateFavoriteIds(prev, recipeId, wasFavoritedBeforeClick),
			);
		} finally {
			setPendingFavoriteIds((prev) => {
				const next = new Set(prev);
				next.delete(recipeId);
				return next;
			});
		}
	};

	return {
		favoriteIds,
		pendingFavoriteIds,
		isFavoritesLoading,
		toggleFavorite,
	};
};
