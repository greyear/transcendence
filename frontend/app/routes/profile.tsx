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
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				setIsLoading(true);
				setError("");

				const response = await fetch(`${API_BASE_URL}/profile`, {
					credentials: "include",
				});
				const data = (await response.json()) as {
					data?: ProfileData;
					error?: string;
				};

				if (!response.ok) {
					setError(data.error ?? "Failed to load profile.");
					return;
				}

				setProfile(data.data ?? null);
			} catch (fetchError) {
				console.error(fetchError);
				setError("Failed to load profile.");
			} finally {
				setIsLoading(false);
			}
		};

		void fetchProfile();
	}, []);

	if (isLoading) {
		return <p className="profile-page-status">{t("profilePage.loading")}</p>;
	}

	if (error) {
		return <p className="profile-page-status">{error}</p>;
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

			<div className="profile-page-details" aria-label="Profile information">
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
