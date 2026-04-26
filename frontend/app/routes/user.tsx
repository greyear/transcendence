import { NavArrowRight } from "iconoir-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useOutletContext, useParams } from "react-router";
import { z } from "zod";
import userPhoto from "~/assets/images/default-avatar.jpeg";
import "~/assets/styles/userProfile.scss";
import "~/assets/styles/recipesGrid.scss";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { RecipeCard } from "~/components/cards/RecipeCard";
import { NotFoundView } from "~/components/NotFoundView";
import { RecipesGrid } from "~/components/RecipesGrid";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import { useRelationSet } from "~/composables/useRelationSet";
import { useScreenSize } from "~/composables/useScreenSize";
import i18next from "~/i18next.server";
import type { LayoutOutletContext } from "~/layouts/layout";
import type { Route } from "./+types/user";

export const loader = async ({ request }: Route.LoaderArgs) => {
	const t = await i18next.getFixedT(request);
	return {
		meta: {
			title: t("pageTitles.userLoading"),
			description: t("pageDescriptions.user"),
		},
	};
};

export const meta: Route.MetaFunction = ({ data }) => [
	{ title: data?.meta.title },
	{ name: "description", content: data?.meta.description },
];

const UserResponseSchema = z.object({
	data: z.object({
		id: z.number(),
		username: z.string(),
		avatar: z.string().nullable(),
		status: z.enum(["online", "offline"]),
		is_following: z.boolean(),
		is_mutual_follower: z.boolean().default(false),
		recipes_count: z.number(),
	}),
});

const FavoritesResponseSchema = z.object({
	data: z.array(
		z.object({
			id: z.number(),
			title: z.string(),
			description: z.string().nullable(),
			picture_url: z.string().nullable(),
		}),
	),
});

type UserProfileData = z.infer<typeof UserResponseSchema>["data"];
type FavoriteRecipe = z.infer<typeof FavoritesResponseSchema>["data"][number];

const UserPage = () => {
	const { t, i18n } = useTranslation();
	const language = i18n.resolvedLanguage ?? "en";
	const { id } = useParams();
	const { screenSize } = useScreenSize();
	const { isAuthenticated, currentUserId, openAuthModal, showNotice } =
		useOutletContext<LayoutOutletContext>();
	const [profile, setProfile] = useState<UserProfileData | null>(null);
	const [favorites, setFavorites] = useState<FavoriteRecipe[] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

	const recipesPerPage = screenSize === "mobile" ? 2 : 4;
	const numericId = id ? Number(id) : null;
	const isOwnProfile =
		numericId !== null && currentUserId !== null && numericId === currentUserId;

	useDocumentTitle(
		profile
			? t("pageTitles.user", { name: profile.username })
			: t("pageTitles.userLoading"),
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
		onAlreadyMember: () => showNotice(t("notices.alreadyFavorited")),
	});

	// Viewer's follow relationship to this one profile. Seeded from the profile
	// response (`is_following`) rather than fetched as a list.
	const followInitialIds = useMemo(
		() => (profile?.is_following ? [profile.id] : []),
		[profile?.is_following, profile?.id],
	);
	const {
		ids: followingIds,
		pendingIds: pendingFollowIds,
		handleToggle: handleFollowToggle,
	} = useRelationSet({
		isAuthenticated,
		openAuthModal,
		itemEndpoint: (userId) => `/users/${userId}/follow`,
		initialIds: followInitialIds,
		onAlreadyMember: () => showNotice(t("notices.alreadyFollowing")),
	});
	const isFollowing = profile ? followingIds.has(profile.id) : false;
	const isFollowPending = profile ? pendingFollowIds.has(profile.id) : false;

	// Re-run on auth change: `/users/:id` (viewer-scoped is_following + presence
	// + is_mutual_follower) and, when applicable, `/users/:id/favorites` depend
	// on the viewer. Without this, logging in/out leaves the follow button and
	// gated favorites section showing stale guest-mode data.
	useEffect(() => {
		if (!id || isOwnProfile) {
			return;
		}

		let ignore = false;

		setIsLoading(true);
		setErrorStatus(null);
		setProfile(null);
		setFavorites(null);

		fetch(`${API_BASE_URL}/users/${id}`, {
			credentials: "include",
		})
			.then(async (profileRes) => {
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

				const profileData = parsedProfile.data.data;
				setProfile(profileData);

				if (!isAuthenticated || !profileData.is_mutual_follower) {
					return;
				}

				const favoritesRes = await fetch(
					`${API_BASE_URL}/users/${id}/favorites`,
					{
						credentials: "include",
						headers: { "X-Language": language },
					},
				);

				if (ignore) {
					return;
				}

				if (favoritesRes.ok) {
					const favoritesBody: unknown = await favoritesRes.json();
					const parsedFavorites =
						FavoritesResponseSchema.safeParse(favoritesBody);
					setFavorites(
						parsedFavorites.success ? parsedFavorites.data.data : [],
					);
				}
			})
			.catch((error: unknown) => {
				if (!ignore) {
					setErrorStatus("unknown");
				}
				if (import.meta.env.DEV) {
					console.error(error);
				}
			})
			.finally(() => {
				if (!ignore) {
					setIsLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, [id, isOwnProfile, isAuthenticated, language]);

	const onFollowClick = () => {
		if (!profile || isFollowPending) {
			return;
		}
		handleFollowToggle(profile.id);
	};

	if (isOwnProfile) {
		return <Navigate to="/profile" replace />;
	}

	if (isLoading) {
		return (
			<p className="user-profile-status-text" aria-live="polite">
				{t("userProfilePage.loading")}
			</p>
		);
	}

	if (errorStatus === 404) {
		return <NotFoundView />;
	}

	if (errorStatus !== null) {
		return (
			<p className="user-profile-status-text" aria-live="assertive">
				{t("userProfilePage.error", { status: errorStatus })}
			</p>
		);
	}

	if (!profile) {
		return <NotFoundView />;
	}

	return (
		<section className="user-profile-page" aria-labelledby="user-profile-name">
			<header className="user-profile-header">
				<img
					className="user-profile-avatar"
					src={resolveMediaUrl(profile.avatar) ?? userPhoto}
					alt=""
				/>
				<div className="user-profile-identity">
					<h1 id="user-profile-name">{profile.username}</h1>
					{/* Presence is only meaningful between mutual followers — show it only
					    when the backend explicitly reports is_mutual_follower: true. */}
					{profile.is_mutual_follower ? (
						<p className={`user-profile-status text-body3 ${profile.status}`}>
							{t(`userProfilePage.${profile.status}`)}
						</p>
					) : null}
				</div>
				<MainButton
					onClick={onFollowClick}
					disabled={isFollowPending}
					aria-busy={isFollowPending}
					aria-label={t(
						isFollowing ? "ariaLabels.unfollowUser" : "ariaLabels.followUser",
						{ name: profile.username },
					)}
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
						to={`/recipes?userId=${profile.id}`}
						className="text-body2"
						aria-label={t("ariaLabels.allRecipesByUser", {
							name: profile.username,
						})}
					>
						{t("userProfilePage.all")}
						<NavArrowRight aria-hidden="true" />
					</TextIconButton>
				</div>
				<RecipesGrid
					isAuthenticated={isAuthenticated}
					openAuthModal={openAuthModal}
					showNotice={showNotice}
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
							to={`/recipes?favoritesOf=${profile.id}`}
							className="text-body2"
							aria-label={t("ariaLabels.allFavoritesOfUser", {
								name: profile.username,
							})}
						>
							{t("userProfilePage.all")}
							<NavArrowRight aria-hidden="true" />
						</TextIconButton>
					</div>
					{favorites.length === 0 ? (
						<p className="recipes-grid-status" aria-live="polite">
							{t("recipesGrid.empty")}
						</p>
					) : (
						<ul className="recipe-card-list">
							{favorites.slice(0, recipesPerPage).map((recipe) => (
								<li key={recipe.id}>
									<RecipeCard
										id={recipe.id}
										title={recipe.title}
										description={recipe.description}
										rating={null}
										pictureUrl={recipe.picture_url}
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
