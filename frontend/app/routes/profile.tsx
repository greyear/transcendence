import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import "~/assets/styles/profile.css";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { useAuth } from "~/contexts/AuthContext";

const ProfileResponseSchema = z.object({
	data: z.object({
		id: z.number(),
		username: z.string(),
		avatar: z.string().nullable(),
	}),
});

const ProfilePage = () => {
	const { t } = useTranslation();
	const {
		isAuthenticated,
		isAuthLoading,
		profile: contextProfile,
		setProfile,
	} = useAuth();
	const [isFetching, setIsFetching] = useState(false);
	const [errorStatus, setErrorStatus] = useState<number | "network" | null>(
		null,
	);

	useEffect(() => {
		if (isAuthLoading || contextProfile || !isAuthenticated) {
			return;
		}

		let ignore = false;
		setIsFetching(true);
		setErrorStatus(null);

		fetch(`${API_BASE_URL}/profile`, { credentials: "include" })
			.then((res) => {
				if (!res.ok) {
					if (!ignore) {
						setErrorStatus(res.status);
					}
					return null;
				}
				const json: Promise<unknown> = res.json();
				return json;
			})
			.then((body) => {
				if (ignore) {
					return;
				}
				const parsed = ProfileResponseSchema.safeParse(body);
				if (parsed.success) {
					setProfile(parsed.data.data);
				}
			})
			.catch((error: unknown) => {
				if (!ignore) {
					setErrorStatus("network");
				}
				console.error(error);
			})
			.finally(() => {
				if (!ignore) {
					setIsFetching(false);
				}
			});

		return () => {
			ignore = true;
		};
	}, [isAuthLoading, isAuthenticated, contextProfile, setProfile]);

	if (isAuthLoading || isFetching) {
		return <p className="profile-page-status">{t("profilePage.loading")}</p>;
	}

	if (!isAuthenticated) {
		return (
			<p className="profile-page-status">
				{t("profilePage.error", { status: "auth" })}
			</p>
		);
	}

	if (errorStatus !== null) {
		return (
			<p className="profile-page-status">
				{t("profilePage.error", { status: errorStatus })}
			</p>
		);
	}

	if (!contextProfile) {
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
					{contextProfile.username}
				</p>
				<p>
					<span className="text-label">{t("profilePage.userId")}</span>
					{contextProfile.id}
				</p>
				<p>
					<span className="text-label">{t("profilePage.avatar")}</span>
					{contextProfile.avatar ?? t("profilePage.noAvatar")}
				</p>
			</div>
		</section>
	);
};

export default ProfilePage;
