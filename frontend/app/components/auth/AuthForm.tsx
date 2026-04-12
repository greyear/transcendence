import { Google, Xmark } from "iconoir-react";
import { type RefObject, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { InputField } from "~/components/inputs/InputField";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import "~/assets/styles/auth.css";

type AuthMode = "login" | "signup";

type AuthFormProps = {
	initialMode?: AuthMode;
	dialogRef?: RefObject<HTMLElement | null>;
	onClose?: () => void;
	onSuccess?: () => void;
};

export const AuthForm = ({
	initialMode = "login",
	dialogRef,
	onClose,
	onSuccess,
}: AuthFormProps) => {
	const { t } = useTranslation();
	const [mode, setMode] = useState<AuthMode>(initialMode);
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setMessage("");
		setIsSubmitting(true);

		try {
			const endpoint =
				mode === "login"
					? `${API_BASE_URL}/auth/login`
					: `${API_BASE_URL}/auth/register`;
			const payload =
				mode === "login"
					? { username, password }
					: { username, email, password };
			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: mode === "login" ? "include" : "same-origin",
				body: JSON.stringify(payload),
			});

			const data = (await response.json()) as { error?: string };

			if (!response.ok) {
				setError(data.error ?? t("loginPage.genericError"));
				return;
			}

			if (mode === "signup") {
				setMode("login");
				setEmail("");
				setPassword("");
				setMessage(t("loginPage.signupSuccess"));
				return;
			}

			setPassword("");
			setMessage(t("loginPage.loginSuccess"));
			onSuccess?.();
		} catch (submitError) {
			console.error(submitError);
			setError(
				submitError instanceof TypeError
					? t("loginPage.networkError")
					: t("loginPage.genericError"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleMode = () => {
		setMode((currentMode) => (currentMode === "login" ? "signup" : "login"));
		setError("");
		setMessage("");
		setUsername("");
		setEmail("");
		setPassword("");
	};

	const handleGoogleLogin = () => {
		setError("");
		setMessage("Google login/signup is not implemented yet!");
	};

	return (
		<section
			className="auth-card"
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby="auth-modal-title"
			tabIndex={-1}
		>
			<div className="auth-card-header">
				<h1 id="auth-modal-title">
					{mode === "login" ? t("loginPage.title") : t("loginPage.signupTitle")}
				</h1>

				{onClose ? (
					<div className="auth-modal-close-row">
						<IconButton
							data-initial-focus
							onClick={onClose}
							aria-label={t("ariaLabels.closeAuthDialog")}
							variant="transparent"
						>
							<Xmark />
						</IconButton>
					</div>
				) : null}
			</div>

			<form className="auth-form" onSubmit={handleSubmit}>
				<div className="auth-fields">
					<InputField
						id="username"
						placeholder={
							mode === "login"
								? t("loginPage.usernameLabel")
								: t("loginPage.signupUsernameLabel")
						}
						name="username"
						hint={
							mode === "signup"
								? t("loginPage.usernameRequirements")
								: undefined
						}
						autoComplete="username"
						minLength={mode === "signup" ? 3 : undefined}
						maxLength={mode === "signup" ? 20 : undefined}
						pattern={mode === "signup" ? "[A-Za-z0-9_]+" : undefined}
						title={
							mode === "signup"
								? t("loginPage.usernameRequirements")
								: undefined
						}
						required
						value={username}
						onChange={(event) => setUsername(event.target.value)}
					/>

					{mode === "signup" ? (
						<InputField
							id="email"
							type="email"
							placeholder={t("loginPage.emailLabel")}
							name="email"
							autoComplete="email"
							required
							value={email}
							onChange={(event) => setEmail(event.target.value)}
						/>
					) : null}

					<InputField
						id="password"
						type="password"
						placeholder={t("loginPage.passwordLabel")}
						name="password"
						hint={
							mode === "signup"
								? t("loginPage.passwordRequirements")
								: undefined
						}
						autoComplete={
							mode === "login" ? "current-password" : "new-password"
						}
						minLength={mode === "signup" ? 8 : undefined}
						maxLength={mode === "signup" ? 64 : undefined}
						pattern={
							mode === "signup"
								? "(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,64}"
								: undefined
						}
						title={
							mode === "signup"
								? t("loginPage.passwordRequirements")
								: undefined
						}
						required
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</div>

				<div className="auth-status" aria-live="polite">
					{message ? <p className="auth-success">{message}</p> : null}
					{error ? <p className="auth-error">{error}</p> : null}
				</div>

				<div className="auth-actions">
					<MainButton type="submit" disabled={isSubmitting}>
						{isSubmitting
							? mode === "login"
								? t("loginPage.submittingButton")
								: t("loginPage.signupSubmittingButton")
							: mode === "login"
								? t("loginPage.logInButton")
								: t("loginPage.signupButton")}
					</MainButton>

					<MainButton
						variant="inverted"
						className="auth-social-button"
						onClick={handleGoogleLogin}
					>
						<span className="auth-social-button-content">
							<Google className="auth-social-google" />
							<span>
								{mode === "login"
									? t("loginPage.googleLoginButton")
									: t("loginPage.googleSignupButton")}
							</span>
						</span>
					</MainButton>
				</div>
			</form>

			<div className="auth-toggle">
				<TextIconButton onClick={toggleMode} size="body2">
					{mode === "login"
						? t("loginPage.toggleSignupPrompt")
						: t("loginPage.toggleLoginPrompt")}
				</TextIconButton>
			</div>
		</section>
	);
};
