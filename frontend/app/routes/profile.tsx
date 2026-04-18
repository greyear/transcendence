import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import "~/assets/styles/profile.css";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

type ProfileData = {
	id: number;
	username: string;
	avatar: string | null;
};

type FavoriteRecipe = {
	id: number;
	title: string;
	description: string | null;
	avatar: string | null;
};

const ProfileResponseSchema = z.object({
	data: z.object({
		id: z.number(),
		username: z.string(),
		avatar: z.string().nullable(),
	}),
});

const FavoriteRecipeSchema = z.object({
	id: z.number().int().positive(),
	title: z.string(),
	description: z.string().nullable(),
	avatar: z.string().nullable(),
});

const FavoriteResponseSchema = z.object({
	data: z.array(FavoriteRecipeSchema),
	count: z.number(),
});

const ProfilePage = () => {
	const { t } = useTranslation();
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
	const [isProfileLoading, setIsProfileLoading] = useState(true);
	const [isFavoritesLoading, setIsFavoritesLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	const [favoritesErrorStatus, setFavoritesErrorStatus] = useState<
		number | "unknown" | null
	>(null);

	useEffect(() => {
		let ignore = false;

		setIsProfileLoading(true);
		setErrorStatus(null);
		setProfile(null);

		fetch(`${API_BASE_URL}/profile`, {
			credentials: "include",
		})
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
				if (ignore) {
					return;
				}

				if (body === null) {
					return;
				}

				const parsed = ProfileResponseSchema.safeParse(body);

				if (!parsed.success) {
					setProfile(null);
					return;
				}

				setProfile(parsed.data.data);
			})
			.catch((error: unknown) => {
				if (!ignore) {
					setErrorStatus("unknown");
				}
				console.error(error);
			})
			.finally(() => {
				if (!ignore) {
					setIsProfileLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, []);

	useEffect(() => {
		let ignore = false;

		setIsFavoritesLoading(true);
		setFavoritesErrorStatus(null);
		setFavorites([]);

		fetch(`${API_BASE_URL}/users/me/favorites`, {
			credentials: "include",
		})
			.then((res) => {
				if (!res.ok) {
					if (!ignore) {
						setFavoritesErrorStatus(res.status);
					}
					return null;
				}
				return res.json();
			})
			.then((body: unknown | null) => {
				if (ignore) {
					return;
				}
				if (body === null) {
					return;
				}

				const parsed = FavoriteResponseSchema.safeParse(body);
				if (!parsed.success) {
					setFavorites([]);
					return;
				}

				setFavorites(parsed.data.data);
			})
			.catch((error: unknown) => {
				if (!ignore) {
					setFavoritesErrorStatus("unknown");
				}
				console.error(error);
			})
			.finally(() => {
				if (!ignore) {
					setIsFavoritesLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, []);
	if (isProfileLoading) {
		return <p className="profile-page-status">{t("profilePage.loading")}</p>;
	}

	if (errorStatus !== null) {
		return (
			<p className="profile-page-status">
				{t("profilePage.error", { status: errorStatus })}
			</p>
		);
	}

	if (!profile) {
		return <p className="profile-page-status">{t("profilePage.notFound")}</p>;
	}

	return (
		<section className="profile-page">
			<header className="profile-page-header">
				<h1>{t("profilePage.title")}</h1>
			</header>

			<div className="profile-page-details">
				<p>
					<span className="text-label">{t("profilePage.username")}</span>
					{profile.username}
				</p>
				<p>
					<span className="text-label">{t("profilePage.userId")}</span>
					{profile.id}
				</p>
				<p>
					<span className="text-label">{t("profilePage.avatar")}</span>
					{profile.avatar ?? t("profilePage.noAvatar")}
				</p>
			</div>
			<section className="profile-page-favorites">
				<h2>{t("profilePage.favoritesTitle")}</h2>
				{isFavoritesLoading ? (
					<p className="profile-page-status">
						{t("profilePage.favoritesLoading")}
					</p>
				) : favoritesErrorStatus !== null ? (
					<p className="profile-page-status">
						{t("profilePage.favoritesError", { status: favoritesErrorStatus })}
					</p>
				) : favorites.length === 0 ? (
					<p className="profile-page-status">
						{t("profilePage.favoritesNotFound")}
					</p>
				) : (
					<ul>
						{favorites.map((favorite) => (
							<li key={favorite.id}>
								<h3>{favorite.title}</h3>
							</li>
						))}
					</ul>
				)}
			</section>
		</section>
	);
};

export default ProfilePage;
