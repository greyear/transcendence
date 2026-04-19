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
import { useScreenSize } from "~/composables/useScreenSize";
import type { LayoutOutletContext } from "~/layouts/layout";

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
					src={profile.avatar ?? userPhoto}
					alt={`${profile.username} profile`}
				/>
				<div className="user-profile-identity">
					<h1 id="user-profile-name">{profile.username}</h1>
					<p className={`user-profile-status text-body3 ${profile.status}`}>
						{t(`userProfilePage.${profile.status}`)}
					</p>
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
					sortValue=""
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
									<RecipeCard
										id={recipe.id}
										title={recipe.title}
										description={recipe.description ?? ""}
										rating=""
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
