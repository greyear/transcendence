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

const ProfileResponseSchema = z.object({
	data: z.object({
		id: z.number(),
		username: z.string(),
		avatar: z.string().nullable(),
	}),
});

const ProfilePage = () => {
	const { t } = useTranslation();
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

	useEffect(() => {
		let ignore = false;

		setIsLoading(true);
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
					setIsLoading(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, []);

	if (isLoading) {
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
		</section>
	);
};

export default ProfilePage;
