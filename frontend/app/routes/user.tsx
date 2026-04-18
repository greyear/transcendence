import { NavArrowRight } from "iconoir-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { z } from "zod";
import userPhoto from "~/assets/images/user-photo.jpg";
import "~/assets/styles/userProfile.css";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { RecipesGrid } from "~/components/RecipesGrid";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useScreenSize } from "~/composables/useScreenSize";

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

type UserProfileData = z.infer<typeof UserResponseSchema>["data"];

const UserPage = () => {
	const { t } = useTranslation();
	const { id } = useParams();
	const { screenSize } = useScreenSize();
	const [profile, setProfile] = useState<UserProfileData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	const [isFollowing, setIsFollowing] = useState(false);
	const [isFollowPending, setIsFollowPending] = useState(false);

	const recipesPerPage = screenSize === "mobile" ? 2 : 4;

	useEffect(() => {
		if (!id) {
			return;
		}

		let ignore = false;

		setIsLoading(true);
		setErrorStatus(null);
		setProfile(null);

		fetch(`${API_BASE_URL}/users/${id}`, { credentials: "include" })
			.then((res) => {
				if (!res.ok) {
					if (!ignore) {
						setErrorStatus(res.status);
					}
					return null;
				}
				return res.json();
			})
			.then((body: unknown | null) => {
				if (ignore || body === null) {
					return;
				}

				const parsed = UserResponseSchema.safeParse(body);
				if (!parsed.success) {
					setProfile(null);
					return;
				}

				setProfile(parsed.data.data);
				setIsFollowing(parsed.data.data.is_following);
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
	}, [id]);

	const toggleFollow = async () => {
		if (!id || isFollowPending) {
			return;
		}

		const next = !isFollowing;
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
					onClick={toggleFollow}
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
				<RecipesGrid sortValue="" page={1} perPage={recipesPerPage} />
			</section>

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
				<RecipesGrid sortValue="" page={1} perPage={recipesPerPage} />
			</section>
		</section>
	);
};

export default UserPage;
