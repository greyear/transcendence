import { Xmark } from "iconoir-react";
import {
	type FormEvent,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "~/components/buttons/IconButton";
import { MainButton } from "~/components/buttons/MainButton";
import { TextIconButton } from "~/components/buttons/TextIconButton";
import { InputField } from "~/components/inputs/InputField";
import { API_BASE_URL } from "~/composables/apiBaseUrl";
import { readAuthError } from "~/schemas/auth";
import "~/assets/styles/auth.css";

type AuthMode = "login" | "signup";

type GoogleCredentialResponse = {
	credential?: string;
};

declare global {
	interface Window {
		google?: {
			accounts: {
				id: {
					initialize: (config: {
						client_id: string;
						callback: (response: GoogleCredentialResponse) => void;
					}) => void;
					renderButton: (
						parent: HTMLElement,
						options: {
							theme: "outline";
							size: "large";
							text: "signin_with" | "signup_with" | "continue_with" | "signin";
							width: number;
							locale?: string;
						},
					) => void;
				};
			};
		};
	}
}

type AuthFormProps = {
	initialMode?: AuthMode;
	dialogRef?: RefObject<HTMLElement | null>;
	onClose?: () => void;
	onSuccess?: () => void;
};

const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_BUTTON_MIN_WIDTH = 240;
const GOOGLE_BUTTON_MAX_WIDTH = 400;
const GOOGLE_CLIENT_ID_PLACEHOLDER =
	"123456789012-abc123def456gh789ijklmn0pqrstuvw.apps.googleusercontent.com";

const loadGoogleIdentityScript = () =>
	new Promise<void>((resolve, reject) => {
		if (window.google?.accounts?.id) {
			resolve();
			return;
		}

		const existingScript = document.querySelector<HTMLScriptElement>(
			`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
		);
		if (existingScript) {
			const status = existingScript.dataset.gsiStatus;
			if (status === "loaded") {
				resolve();
				return;
			}
			if (status === "error") {
				reject(new Error("Google Identity Services failed to load"));
				return;
			}
			existingScript.addEventListener("load", () => resolve(), { once: true });
			existingScript.addEventListener(
				"error",
				() => reject(new Error("Google Identity Services failed to load")),
				{ once: true },
			);
			return;
		}

		const script = document.createElement("script");
		script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.dataset.gsiStatus = "loading";
		script.onload = () => {
			script.dataset.gsiStatus = "loaded";
			resolve();
		};
		script.onerror = () => {
			script.dataset.gsiStatus = "error";
			reject(new Error("Google Identity Services failed to load"));
		};
		document.head.appendChild(script);
	});

export const AuthForm = ({
	initialMode = "login",
	dialogRef,
	onClose,
	onSuccess,
}: AuthFormProps) => {
	const { t, i18n } = useTranslation();
	const googleButtonRef = useRef<HTMLDivElement | null>(null);
	const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
	const googleMissingClientId =
		!googleClientId || googleClientId === GOOGLE_CLIENT_ID_PLACEHOLDER;
	const [mode, setMode] = useState<AuthMode>(initialMode);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isGoogleReady, setIsGoogleReady] = useState(false);

	const handleGoogleCredential = useCallback(
		async (googleResponse: GoogleCredentialResponse) => {
			setError("");
			setMessage("");

			if (!googleResponse.credential) {
				setError(t("authModal.googleTokenError"));
				return;
			}

			try {
				const response = await fetch(`${API_BASE_URL}/auth/google`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${googleResponse.credential}`,
					},
					credentials: "include",
				});

				const authError = await readAuthError(response);

				if (!response.ok) {
					setError(authError ?? t("authModal.genericError"));
					return;
				}

				setEmail("");
				setPassword("");
				setMessage(t("authModal.loginSuccess"));
				onSuccess?.();
			} catch (googleError) {
				console.error(googleError);
				setError(
					googleError instanceof TypeError
						? t("authModal.networkError")
						: t("authModal.genericError"),
				);
			}
		},
		[onSuccess, t],
	);

	useEffect(() => {
		const buttonContainer = googleButtonRef.current;
		if (!buttonContainer || googleMissingClientId) {
			setIsGoogleReady(false);
			return;
		}

		let isCurrent = true;
		buttonContainer.replaceChildren();
		setIsGoogleReady(false);

		loadGoogleIdentityScript()
			.then(() => {
				if (!isCurrent || !window.google?.accounts?.id) {
					return;
				}

				window.google.accounts.id.initialize({
					client_id: googleClientId,
					callback: handleGoogleCredential,
				});
				buttonContainer.replaceChildren();
				const buttonWidth = Math.max(
					GOOGLE_BUTTON_MIN_WIDTH,
					Math.min(
						GOOGLE_BUTTON_MAX_WIDTH,
						Math.floor(buttonContainer.clientWidth),
					),
				);
				window.google.accounts.id.renderButton(buttonContainer, {
					theme: "outline",
					size: "large",
					text: "continue_with",
					width: buttonWidth,
					locale: i18n.resolvedLanguage ?? undefined,
				});
				setIsGoogleReady(true);
			})
			.catch((scriptError) => {
				console.error(scriptError);
				if (isCurrent) {
					setError(t("authModal.googleUnavailable"));
				}
			});

		return () => {
			isCurrent = false;
			buttonContainer.replaceChildren();
		};
	}, [googleMissingClientId, handleGoogleCredential, i18n.resolvedLanguage, t]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setMessage("");
		setIsSubmitting(true);

		try {
			const endpoint =
				mode === "login"
					? `${API_BASE_URL}/auth/login`
					: `${API_BASE_URL}/auth/register`;
			const payload = { email, password };
			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify(payload),
			});

			const authError = await readAuthError(response);

			if (!response.ok) {
				setError(authError ?? t("authModal.genericError"));
				return;
			}

			if (mode === "signup") {
				setPassword("");
				setMessage(t("authModal.signupSuccess"));
				onSuccess?.();
				return;
			}

			setPassword("");
			setMessage(t("authModal.loginSuccess"));
			onSuccess?.();
		} catch (submitError) {
			console.error(submitError);
			setError(
				submitError instanceof TypeError
					? t("authModal.networkError")
					: t("authModal.genericError"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const toggleMode = () => {
		setMode((currentMode) => (currentMode === "login" ? "signup" : "login"));
		setError("");
		setMessage("");
		setEmail("");
		setPassword("");
	};

	const canUseGoogleButton = isGoogleReady && !googleMissingClientId;

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
					{mode === "login" ? t("authModal.title") : t("authModal.signupTitle")}
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
						key={`email-${mode}`}
						id="email"
						type="email"
						placeholder={t("authModal.emailLabel")}
						name="email"
						autoComplete="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>

					<InputField
						key={`password-${mode}`}
						id="password"
						type="password"
						placeholder={t("authModal.passwordLabel")}
						name="password"
						hint={
							mode === "signup"
								? t("authModal.passwordRequirements")
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
								? t("authModal.passwordRequirements")
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
								? t("authModal.submittingButton")
								: t("authModal.signupSubmittingButton")
							: mode === "login"
								? t("authModal.logInButton")
								: t("authModal.signupButton")}
					</MainButton>

					{!googleMissingClientId ? (
						<>
							<div className="auth-divider" aria-hidden="true">
								<span>{t("authModal.orDivider")}</span>
							</div>

							<div className="auth-google-button-shell">
								<div
									ref={googleButtonRef}
									className="auth-google-render-target"
									aria-hidden={!canUseGoogleButton}
								/>
							</div>
						</>
					) : null}
				</div>
			</form>

			<div className="auth-toggle">
				<TextIconButton onClick={toggleMode} size="body2">
					{mode === "login"
						? t("authModal.toggleSignupPrompt")
						: t("authModal.toggleLoginPrompt")}
				</TextIconButton>
			</div>
		</section>
	);
};
