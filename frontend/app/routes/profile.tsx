import { NavArrowDown } from "iconoir-react";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type MetaFunction, useNavigate, useOutletContext } from "react-router";
import { z } from "zod";
import defaultAvatar from "~/assets/images/default-avatar.jpeg";
import "~/assets/styles/profile.scss";
import { ChangePasswordModal } from "~/components/auth/ChangePasswordModal";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { ConfirmationModal } from "~/components/ConfirmationModal";
import { InputField } from "~/components/inputs/InputField";
import { NotFoundView } from "~/components/NotFoundView";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { resolveMediaUrl } from "~/composables/resolveMediaUrl";
import { useDocumentTitle } from "~/composables/useDocumentTitle";
import type { LayoutOutletContext } from "~/layouts/layout";

export const meta: MetaFunction = () => [
	{ title: "My profile — Transcendence" },
	{
		name: "description",
		content:
			"Manage your Transcendence profile, recipes, favorites, and account settings.",
	},
];

type AuthUserData = {
	id: number;
	email: string;
	isGoog: boolean;
};

const AuthMeResponseSchema = z.object({
	id: z.number(),
	email: z.string(),
	isGoog: z.boolean(),
});

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

const PRESET_AVATAR_PATHS = Array.from(
	{ length: 8 },
	(_, index) => `/avatars/avatar-${index + 1}.jpeg`,
);
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const ProfilePage = () => {
	const { t } = useTranslation();
	useDocumentTitle(t("pageTitles.profile"));
	const navigate = useNavigate();
	const { isAuthenticated, openAuthModal, resetAuthState } =
		useOutletContext<LayoutOutletContext>();
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [isProfileLoading, setIsProfileLoading] = useState(true);
	const [errorStatus, setErrorStatus] = useState<number | "unknown" | null>(
		null,
	);
	const avatarInputRef = useRef<HTMLInputElement | null>(null);
	const [username, setUsername] = useState("");
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [selectedAvatarPath, setSelectedAvatarPath] = useState<string | null>(
		null,
	);
	const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
	const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [profileMessage, setProfileMessage] = useState("");
	const [profileError, setProfileError] = useState("");
	const [avatarError, setAvatarError] = useState("");
	const [authUser, setAuthUser] = useState<AuthUserData | null>(null);
	const [isAuthUserLoading, setIsAuthUserLoading] = useState(true);
	const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
		useState(false);
	const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
		useState(false);
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);

	const onCloseChangePasswordModal = () => {
		setIsChangePasswordModalOpen(false);
	};

	const onChangePasswordSuccess = () => {
		setIsChangePasswordModalOpen(false);
		setProfileError("");
		setProfileMessage(t("changePasswordModal.changeSuccess"));
	};

	const onOpenChangePasswordModal = () => {
		if (!isAuthenticated) {
			openAuthModal(() => {
				setIsChangePasswordModalOpen(true);
			});
			return;
		}

		setIsChangePasswordModalOpen(true);
	};

	useEffect(() => {
		if (!isAuthenticated) {
			setAuthUser(null);
			setIsAuthUserLoading(false);
			return;
		}

		let ignore = false;

		setIsAuthUserLoading(true);

		fetch(`${API_BASE_URL}/auth/me`, {
			credentials: "include",
		})
			.then((res) => {
				if (!res.ok) return null;
				return res.json();
			})
			.then((body: unknown | null) => {
				if (ignore || body === null) {
					return;
				}

				const parsed = AuthMeResponseSchema.safeParse(body);
				if (!parsed.success) {
					return;
				}
				setAuthUser(parsed.data);
			})
			.catch((error: unknown) => {
				console.error(error);
			})
			.finally(() => {
				if (!ignore) setIsAuthUserLoading(false);
			});

		return () => {
			ignore = true;
		};
	}, [isAuthenticated]);

	useEffect(() => {
		if (!isAuthenticated) {
			setProfile(null);
			setIsProfileLoading(false);
			setErrorStatus(null);
			return;
		}

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
				if (ignore || body === null) {
					return;
				}

				const parsed = ProfileResponseSchema.safeParse(body);

				if (!parsed.success) {
					setProfile(null);
					return;
				}

				setProfile(parsed.data.data);
				setUsername(parsed.data.data.username);
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
	}, [isAuthenticated]);

	useEffect(() => {
		return () => {
			if (avatarPreviewUrl) {
				URL.revokeObjectURL(avatarPreviewUrl);
			}
		};
	}, [avatarPreviewUrl]);

	const hasUsernameChanged = username.trim() !== (profile?.username ?? "");
	const hasPresetAvatarChanged =
		selectedAvatarPath !== null && selectedAvatarPath !== profile?.avatar;
	const hasAvatarChanged = avatarFile !== null || hasPresetAvatarChanged;
	const hasProfileChanges = hasUsernameChanged || hasAvatarChanged;
	const activeAvatarPath = selectedAvatarPath ?? profile?.avatar;
	const selectedPresetAvatarPath = activeAvatarPath ?? PRESET_AVATAR_PATHS[0];
	const avatarSrc =
		avatarPreviewUrl ?? resolveMediaUrl(activeAvatarPath) ?? defaultAvatar;

	const handleAvatarChange = (file: File | null) => {
		if (file && file.size > MAX_AVATAR_SIZE_BYTES) {
			if (avatarInputRef.current) {
				avatarInputRef.current.value = "";
			}
			setProfileMessage("");
			setAvatarError(t("profilePage.avatarSizeError"));
			return;
		}

		setAvatarFile(file);
		setSelectedAvatarPath(null);
		setAvatarError("");
		setProfileMessage("");
		setProfileError("");

		setAvatarPreviewUrl(file ? URL.createObjectURL(file) : null);
	};

	const handlePresetAvatarSelect = (avatarPath: string) => {
		setSelectedAvatarPath(avatarPath);
		setAvatarFile(null);
		setAvatarError("");
		setProfileMessage("");
		setProfileError("");

		if (avatarInputRef.current) {
			avatarInputRef.current.value = "";
		}

		setAvatarPreviewUrl(null);
	};

	const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const nextUsername = username.trim();

		if (!nextUsername) {
			setProfileError(t("profilePage.usernameRequired"));
			return;
		}

		if (!hasProfileChanges) {
			return;
		}

		const formData = new FormData();
		formData.append("username", nextUsername);
		if (avatarFile) {
			formData.append("avatar", avatarFile);
		} else if (selectedAvatarPath !== null) {
			formData.append("avatar", selectedAvatarPath);
		}

		setIsSaving(true);
		setAvatarError("");
		setProfileMessage("");
		setProfileError("");

		try {
			const response = await fetch(`${API_BASE_URL}/profile`, {
				method: "PUT",
				credentials: "include",
				body: formData,
			});
			const body: unknown = await response.json().catch(() => null);

			if (!response.ok) {
				setProfileError(
					response.status === 409
						? t("profilePage.usernameTaken")
						: t("profilePage.saveError"),
				);
				return;
			}

			const parsed = ProfileResponseSchema.safeParse(body);
			if (!parsed.success) {
				setProfileError(t("profilePage.saveError"));
				return;
			}

			setProfile(parsed.data.data);
			setUsername(parsed.data.data.username);
			setAvatarFile(null);
			setSelectedAvatarPath(null);
			setIsAvatarPickerOpen(false);
			setAvatarPreviewUrl(null);
			setProfileMessage(t("profilePage.saveSuccess"));
		} catch (error) {
			console.error(error);
			setProfileError(t("profilePage.saveError"));
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (!authUser?.id) {
			setProfileError(t("profilePage.accountUnavailable"));
			return;
		}
		setIsDeletingAccount(true);

		try {
			const response = await fetch(`${API_BASE_URL}/auth/delete`, {
				method: "DELETE",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: authUser.id,
				}),
			});

			if (!response.ok) {
				setProfileError(t("profilePage.errorDeletingProfile"));
				return;
			}

			resetAuthState();
			navigate("/", { replace: true });
		} catch (error) {
			console.error(error);
			setProfileError(t("profilePage.errorDeletingProfile"));
		} finally {
			setIsDeletingAccount(false);
			setIsDeleteAccountModalOpen(false);
		}
	};

	const handleLogOut = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			if (!response.ok) {
				setProfileError(t("profilePage.errorLoggingOut"));
				return;
			}

			resetAuthState();
			navigate("/", { replace: true });
		} catch (error) {
			console.error(error);
			setProfileError(t("profilePage.errorLoggingOut"));
		}
	};

	useEffect(() => {
		if (!profileMessage && !profileError && !avatarError) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setProfileMessage("");
			setProfileError("");
			setAvatarError("");
		}, 5_000);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [avatarError, profileMessage, profileError]);

	if (isProfileLoading) {
		return <p className="profile-page-status">{t("profilePage.loading")}</p>;
	}

	if (!isAuthenticated) {
		return (
			<p className="profile-page-status">{t("profilePage.signInRequired")}</p>
		);
	}

	if (errorStatus === 404) {
		return <NotFoundView />;
	}

	if (errorStatus !== null) {
		return (
			<p className="profile-page-status">
				{t("profilePage.error", { status: errorStatus })}
			</p>
		);
	}

	if (!profile) {
		return <NotFoundView />;
	}

	return (
		<section className="profile-page" aria-labelledby="profile-page-title">
			<h1 id="profile-page-title" className="visually-hidden">
				{t("profilePage.title")}
			</h1>
			<form className="profile-page-form" onSubmit={handleProfileSubmit}>
				<div className="profile-avatar-section">
					<div className="profile-avatar-display">
						<img className="profile-avatar-image" src={avatarSrc} alt="" />
					</div>

					<input
						ref={avatarInputRef}
						className="profile-avatar-input"
						type="file"
						accept="image/jpeg,image/png,image/webp"
						onChange={(event) => {
							handleAvatarChange(event.target.files?.[0] ?? null);
						}}
					/>

					<TextIconButton
						onClick={() => setIsAvatarPickerOpen((isOpen) => !isOpen)}
						selected={isAvatarPickerOpen}
						size="body2"
					>
						{t("profilePage.changePhoto")}
						<NavArrowDown
							className={`profile-avatar-toggle-icon ${
								isAvatarPickerOpen ? "is-open" : ""
							}`}
							aria-hidden="true"
						/>
					</TextIconButton>

					{isAvatarPickerOpen ? (
						<div className="profile-avatar-picker">
							<fieldset className="profile-avatar-options">
								<legend className="profile-avatar-options-label text-body3">
									{t("profilePage.chooseAvatar")}
								</legend>
								<div className="profile-avatar-options-grid">
									{PRESET_AVATAR_PATHS.map((avatarPath, index) => {
										const isSelected =
											avatarPreviewUrl === null &&
											selectedPresetAvatarPath === avatarPath;

										return (
											<button
												key={avatarPath}
												type="button"
												className={`profile-avatar-option ${
													isSelected ? "is-selected" : ""
												}`}
												aria-label={t("profilePage.chooseAvatarOption", {
													number: index + 1,
												})}
												aria-pressed={isSelected}
												onClick={() => handlePresetAvatarSelect(avatarPath)}
											>
												<img
													src={resolveMediaUrl(avatarPath) ?? defaultAvatar}
													alt=""
													aria-hidden="true"
												/>
											</button>
										);
									})}
								</div>
							</fieldset>

							<p className="profile-avatar-separator">
								{t("profilePage.avatarOr")}
							</p>

							<TextIconButton
								onClick={() => avatarInputRef.current?.click()}
								size="body2"
							>
								{t("profilePage.uploadPhoto")}
							</TextIconButton>

							{avatarError ? (
								<p className="profile-error" aria-live="polite">
									{avatarError}
								</p>
							) : null}
						</div>
					) : null}
				</div>

				<InputField
					id="profile-username"
					name="username"
					autoComplete="username"
					hint={t("profilePage.usernameHint")}
					label={t("profilePage.username")}
					value={username}
					onChange={(event) => {
						setUsername(event.target.value);
						setProfileMessage("");
						setProfileError("");
					}}
					required
					maxLength={32}
				/>

				<InputField
					id="profile-email"
					name="email"
					type="email"
					autoComplete="email"
					className="profile-email-field"
					label={t("profilePage.email")}
					value={
						isAuthUserLoading
							? t("profilePage.emailLoading")
							: (authUser?.email ?? t("profilePage.emailUnavailable"))
					}
					disabled
				/>

				{hasProfileChanges ? (
					<MainButton
						className="profile-save-button"
						type="submit"
						disabled={isSaving}
					>
						{isSaving ? t("profilePage.saving") : t("profilePage.save")}
					</MainButton>
				) : null}

				<output
					className="profile-page-form-status"
					aria-live="polite"
					aria-atomic="true"
				>
					{profileMessage ? (
						<span className="profile-success">{profileMessage}</span>
					) : null}
					{profileError ? (
						<span className="profile-error">{profileError}</span>
					) : null}
				</output>
			</form>

			<div className="profile-page-actions">
				{authUser?.isGoog === false && (
					<TextIconButton onClick={onOpenChangePasswordModal} size="body2">
						{t("profilePage.changePassword")}
					</TextIconButton>
				)}
				<TextIconButton onClick={handleLogOut} size="body2">
					{t("profilePage.logout")}
				</TextIconButton>
				<TextIconButton
					className="action-delete-account"
					onClick={() => setIsDeleteAccountModalOpen(true)}
					size="body2"
					disabled={!authUser?.id || isAuthUserLoading || isDeletingAccount}
				>
					{t("profilePage.deleteAccount")}
				</TextIconButton>
			</div>
			<ChangePasswordModal
				isOpen={isChangePasswordModalOpen}
				onClose={onCloseChangePasswordModal}
				onSuccess={onChangePasswordSuccess}
				userId={authUser?.id ?? null}
			/>
			<ConfirmationModal
				isOpen={isDeleteAccountModalOpen}
				onClose={() => {
					if (isDeletingAccount) {
						return;
					}

					setIsDeleteAccountModalOpen(false);
				}}
				onConfirm={handleDeleteAccount}
				title={t("profilePage.confirmDeleteAccount")}
				confirmLabel={t("profilePage.deleteAccount")}
				isConfirming={isDeletingAccount}
			/>
		</section>
	);
};

export default ProfilePage;
