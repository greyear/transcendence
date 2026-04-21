import { NavArrowRight } from "iconoir-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useOutletContext, useParams } from "react-router";
import { z } from "zod";
import userPhoto from "~/assets/images/user-photo.jpg";
import "~/assets/styles/userProfile.css";
import "~/assets/styles/recipesGrid.css";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { RecipeCard } from "~/components/cards/RecipeCard";
import { RecipesGrid } from "~/components/RecipesGrid";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import { useScreenSize } from "~/composables/useScreenSize";
import type { LayoutOutletContext } from "~/layouts/layout";
import { FavoriteRecipesResponseSchema } from "~/schemas/favorites";

const UserResponseSchema = z.object({
	data: z.object({
		id: z.number(),
		username: z.string(),
		avatar: z.string().nullable(),
		status: z.enum(["online", "offline"]),
		is_following: z.boolean(),
		recipes_count: z.number(),
	}),
});

const FavoritesResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.number(),
			title: z.string(),
			description: z.string().nullable(),
			avatar: z.string().nullable(),
		}),
	),
});

type UserProfileData = z.infer<typeof UserResponseSchema>["data"];
type FavoriteRecipe = z.infer<typeof FavoritesResponseSchema>["data"][number];

const UserPage = () => {
	const { t } = useTranslation();
	const { id } = useParams();
	const { screenSize } = useScreenSize();
	const { isAuthenticated, currentUserId, openAuthModal } =
		useOutletContext<LayoutOutletContext>();
	const [profile, setProfile] = useState<UserProfileData | null>(null);
	const [favorites, setFavorites] = useState<FavoriteRecipe[] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	const [isFollowing, setIsFollowing] = useState(false);
	const [isFollowPending, setIsFollowPending] = useState(false);
	const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(
		new Set(),
	);
	const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);

	const recipesPerPage = screenSize === "mobile" ? 2 : 4;
	const numericId = id ? Number(id) : null;
	const isOwnProfile =
		numericId !== null && currentUserId !== null && numericId === currentUserId;

	useEffect(() => {
		if (!id || isOwnProfile) {
			return;
		}

		let ignore = false;

		setIsLoading(true);
		setErrorStatus(null);
		setProfile(null);
		setFavorites(null);

		const profileRequest = fetch(`${API_BASE_URL}/users/${id}`, {
			credentials: "include",
		});
		const favoritesRequest = fetch(`${API_BASE_URL}/users/${id}/favorites`, {
			credentials: "include",
		});

		Promise.all([profileRequest, favoritesRequest])
			.then(async ([profileRes, favoritesRes]) => {
				if (ignore) {
					return;
				}

				if (!profileRes.ok) {
					setErrorStatus(profileRes.status);
					return;
				}

				const profileBody: unknown = await profileRes.json();
				const parsedProfile = UserResponseSchema.safeParse(profileBody);
				if (!parsedProfile.success) {
					setProfile(null);
					return;
				}

				setProfile(parsedProfile.data.data);
				setIsFollowing(parsedProfile.data.data.is_following);

				if (favoritesRes.ok) {
					const favoritesBody: unknown = await favoritesRes.json();
					const parsedFavorites =
						FavoritesResponseSchema.safeParse(favoritesBody);
					setFavorites(
						parsedFavorites.success ? parsedFavorites.data.data : [],
					);
				} else {
					setFavorites(null);
				}
			})
			.catch((error: unknown) => {
				if (!ignore) {
					setErrorStatus("unknown");
				}
				console.error(error);
			})
			.finally(() => {
				if (!ignore) {
					setIsLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, [id, isOwnProfile]);

	useEffect(() => {
		if (!isAuthenticated) {
			setFavoriteIds(new Set());
			setIsFavoritesLoading(false);
			return;
		}

		let ignore = false;
		setIsFavoritesLoading(true);

		fetch(`${API_BASE_URL}/users/me/favorites`, {
			credentials: "include",
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((body: unknown) => {
				if (ignore) {
					return;
				}
				const parsed = FavoriteRecipesResponseSchema.safeParse(body);
				setFavoriteIds(
					parsed.success
						? new Set(parsed.data.data.map((favorite) => favorite.id))
						: new Set(),
				);
			})
			.catch((error: unknown) => {
				console.error(error);
				if (!ignore) {
					setFavoriteIds(new Set());
				}
			})
			.finally(() => {
				if (!ignore) {
					setIsFavoritesLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, [isAuthenticated]);

	const updateFavoriteIds = (
		current: Set<number>,
		recipeId: number,
		shouldBeFavorited: boolean,
	) => {
		const next = new Set(current);
		if (shouldBeFavorited) {
			next.add(recipeId);
		} else {
			next.delete(recipeId);
		}
		return next;
	};

	const toggleFavorite = async (recipeId: number) => {
		if (pendingFavoriteIds.has(recipeId)) {
			return;
		}

		const wasFavorited = favoriteIds.has(recipeId);
		const shouldBeFavorited = !wasFavorited;

		setFavoriteIds((prev) =>
			updateFavoriteIds(prev, recipeId, shouldBeFavorited),
		);
		setPendingFavoriteIds((prev) => new Set(prev).add(recipeId));

		try {
			const res = await fetch(`${API_BASE_URL}/recipes/${recipeId}/favorite`, {
				method: shouldBeFavorited ? "POST" : "DELETE",
				credentials: "include",
			});
			if (!res.ok && res.status !== 409) {
				setFavoriteIds((prev) =>
					updateFavoriteIds(prev, recipeId, wasFavorited),
				);
			}
		} catch (error) {
			console.error(error);
			setFavoriteIds((prev) => updateFavoriteIds(prev, recipeId, wasFavorited));
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

	const sendFollowRequest = async (next: boolean) => {
		if (!id) {
			return;
		}

		setIsFollowPending(true);
		setIsFollowing(next);

		try {
			const res = await fetch(`${API_BASE_URL}/users/${id}/follow`, {
				method: next ? "POST" : "DELETE",
				credentials: "include",
			});

			if (!res.ok) {
				setIsFollowing(!next);
			}
		} catch (error) {
			console.error(error);
			setIsFollowing(!next);
		} finally {
			setIsFollowPending(false);
		}
	};

	const onFollowClick = () => {
		if (!id || isFollowPending) {
			return;
		}

		if (!isAuthenticated) {
			openAuthModal(() => {
				void sendFollowRequest(true);
			});
			return;
		}

		void sendFollowRequest(!isFollowing);
	};

	if (isOwnProfile) {
		return <Navigate to="/profile" replace />;
	}

	if (isLoading) {
		return (
			<p className="user-profile-status-text">{t("userProfilePage.loading")}</p>
		);
	}

	if (errorStatus !== null) {
		return (
			<p className="user-profile-status-text">
				{t("userProfilePage.error", { status: errorStatus })}
			</p>
		);
	}

	if (!profile) {
		return (
			<p className="user-profile-status-text">
				{t("userProfilePage.notFound")}
			</p>
		);
	}

	return (
		<section className="user-profile-page" aria-labelledby="user-profile-name">
			<header className="user-profile-header">
				<img
					className="user-profile-avatar"
					src={resolveMediaUrl(profile.avatar) ?? userPhoto}
					alt={`${profile.username} profile`}
				/>
				<div className="user-profile-identity">
					<h1 id="user-profile-name">{profile.username}</h1>
					{isAuthenticated ? (
						<p className={`user-profile-status text-body3 ${profile.status}`}>
							{t(`userProfilePage.${profile.status}`)}
						</p>
					) : null}
				</div>
				<MainButton
					onClick={onFollowClick}
					disabled={isFollowPending}
					variant={isFollowing ? "inverted" : "primary"}
					className="user-profile-follow-button"
				>
					{isFollowing
						? t("userProfilePage.unfollow")
						: t("userProfilePage.follow")}
				</MainButton>
			</header>

			<section
				className="user-profile-recipes-section"
				aria-labelledby="authored-recipes-heading"
			>
				<div className="user-profile-recipe-header">
					<h2 id="authored-recipes-heading">
						{t("userProfilePage.authoredRecipes")}
					</h2>
					<TextIconButton
						to="/recipes"
						className="text-body2"
						aria-label={t("ariaLabels.allAuthoredRecipes")}
					>
						{t("userProfilePage.all")}
						<NavArrowRight aria-hidden="true" />
					</TextIconButton>
				</div>
				<RecipesGrid
					isAuthenticated={isAuthenticated}
					openAuthModal={openAuthModal}
					page={1}
					perPage={recipesPerPage}
					userId={profile.id}
				/>
			</section>

			{favorites !== null ? (
				<section
					className="user-profile-recipes-section"
					aria-labelledby="favorite-recipes-heading"
				>
					<div className="user-profile-recipe-header">
						<h2 id="favorite-recipes-heading">
							{t("userProfilePage.favoriteRecipes")}
						</h2>
						<TextIconButton
							to="/recipes"
							className="text-body2"
							aria-label={t("ariaLabels.allFavoriteRecipes")}
						>
							{t("userProfilePage.all")}
							<NavArrowRight aria-hidden="true" />
						</TextIconButton>
					</div>
					{favorites.length === 0 ? (
						<p className="recipes-grid-status">{t("recipesGrid.empty")}</p>
					) : (
						<ul className="recipe-card-list">
							{favorites.slice(0, recipesPerPage).map((recipe) => (
								<li key={recipe.id}>
									{/* TODO(favorites-owner): GET /users/:id/favorites returns the
									    author avatar (u.avatar), not the recipe thumbnail — update the
									    backend query to select picture_url from recipe_media, then
									    replace pictureUrl below. */}
									<RecipeCard
										id={recipe.id}
										title={recipe.title}
										description={recipe.description}
										rating={null}
										pictureUrl={recipe.avatar}
										isFavorited={favoriteIds.has(recipe.id)}
										isFavoritePending={
											isFavoritesLoading || pendingFavoriteIds.has(recipe.id)
										}
										onFavoriteClick={handleFavoriteClick}
									/>
								</li>
							))}
						</ul>
					)}
				</section>
			) : null}
		</section>
	);
};

export default UserPage;
