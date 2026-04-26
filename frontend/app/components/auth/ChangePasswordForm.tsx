import { Xmark } from "iconoir-react";
import { type FormEvent, type RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import "~/assets/styles/auth.scss";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { readAuthError } from "~/schemas/auth";
import { InputField } from "../inputs/InputField";

type ChangePasswordFormProps = {
	dialogRef?: RefObject<HTMLElement | null>;
	onClose?: () => void;
	onSuccess?: () => void;
	userId: number | null;
};

export const ChangePasswordForm = ({
	dialogRef,
	onClose,
	onSuccess,
	userId,
}: ChangePasswordFormProps) => {
	const { t } = useTranslation();
	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");

		if (!userId) {
			setError(t("changePasswordModal.userUnavailable"));
			return;
		}

		if (newPassword !== confirmPassword) {
			setError(t("changePasswordModal.passwordsDoNotMatch"));
			return;
		}

		if (oldPassword === newPassword) {
			setError(t("changePasswordModal.sameAsCurrent"));
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					userId,
					password: oldPassword,
					newPassword,
				}),
			});

			const changePasswordError = await readAuthError(response);

			if (!response.ok) {
				if (
					response.status === 401 &&
					changePasswordError === "Password mismatch"
				) {
					setError(t("changePasswordModal.currentPasswordIncorrect"));
					return;
				}

				setError(changePasswordError ?? t("changePasswordModal.genericError"));
				return;
			}

			setOldPassword("");
			setNewPassword("");
			setConfirmPassword("");
			onSuccess?.();
		} catch (submitError) {
			if (import.meta.env.DEV) {
				console.error(submitError);
			}
			setError(
				submitError instanceof TypeError
					? t("authModal.networkError")
					: t("changePasswordModal.genericError"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section
			className="auth-card"
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="change-password-modal-title"
			tabIndex={-1}
		>
			<div className="auth-card-header">
				<h2 id="change-password-modal-title">
					{t("changePasswordModal.title")}
				</h2>
				{onClose ? (
					<div className="auth-modal-close-row">
						<IconButton
							data-initial-focus
							onClick={onClose}
							aria-label={t("ariaLabels.closeAuthDialog")}
							variant="transparent"
						>
							<Xmark aria-hidden="true" />
						</IconButton>
					</div>
				) : null}
			</div>

			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="auth-fields">
					<InputField
						id="current-password"
						type="password"
						label={t("changePasswordModal.oldPassword")}
						name="current-password"
						autoComplete="current-password"
						required
						value={oldPassword}
						onChange={(event) => setOldPassword(event.target.value)}
					/>

					<InputField
						id="new-password"
						type="password"
						label={t("changePasswordModal.newPassword")}
						name="new-password"
						hint={t("authModal.passwordRequirements")}
						autoComplete="new-password"
						minLength={8}
						maxLength={64}
						pattern="(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,64}"
						title={t("authModal.passwordRequirements")}
						required
						value={newPassword}
						onChange={(event) => setNewPassword(event.target.value)}
					/>

					<InputField
						id="confirm-password"
						type="password"
						label={t("changePasswordModal.confirmPassword")}
						name="confirm-password"
						autoComplete="new-password"
						required
						value={confirmPassword}
						onChange={(event) => setConfirmPassword(event.target.value)}
					/>
				</div>

				<output className="auth-status" aria-live="polite" aria-atomic="true">
					{error ? <span className="auth-error">{error}</span> : null}
				</output>

				<div className="auth-actions">
					<MainButton type="submit" disabled={isSubmitting}>
						{isSubmitting
							? t("changePasswordModal.submitting")
							: t("changePasswordModal.submit")}
					</MainButton>
				</div>
			</form>
		</section>
	);
};
