import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "~/assets/styles/profile.css";
import { API_BASE_URL } from "~/composables/apiBaseUrl";

type ProfileData = {
	id: number;
	username: string;
	avatar: string | null;
};

const ProfilePage = () => {
	const { t } = useTranslation();
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);

	useEffect(() => {
		setIsLoading(true);
		setErrorStatus(null);
		setProfile(null);

		fetch(`${API_BASE_URL}/profile`, {
			credentials: "include",
		})
			.then((res) => {
				if (!res.ok) {
					setErrorStatus(res.status);
					return null;
				}

				return res.json() as Promise<{ data?: ProfileData }>;
			})
			.then((body) => {
				if (!body?.data) {
					setProfile(null);
					return;
				}

				setProfile(body.data);
			})
			.catch((error: unknown) => {
				setErrorStatus("unknown");
				console.error(error);
			})
			.finally(() => {
				setIsLoading(false);
			});
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
				<h1>My profile</h1>
				<p className="text-body2">Quick check for the profile endpoint.</p>
			</header>

			<div className="profile-page-details">
				<p>
					<span className="text-label">Username</span>
					{profile.username}
				</p>
				<p>
					<span className="text-label">User ID</span>
					{profile.id}
				</p>
				<p>
					<span className="text-label">Avatar</span>
					{profile.avatar ?? "No avatar set"}
				</p>
			</div>
		</section>
	);
};

export default ProfilePage;
