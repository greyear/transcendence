import type { InputHTMLAttributes } from "react";
import { useRef, useState } from "react";
import "../../assets/styles/inputField.css";
import { Eye, EyeClosed } from "iconoir-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../buttons/IconButton";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
	id: string;
	hint?: string;
	error?: string;
	floatingLabel?: boolean;
};

type WithLabel = BaseProps & {
	label: string;
	placeholder?: string;
};

type WithPlaceholder = BaseProps & {
	label?: string;
	placeholder: string;
};

type InputFieldProps = WithLabel | WithPlaceholder;

export const InputField = ({
	className = "",
	type = "text",
	placeholder = "",
	label,
	hint,
	error,
	id,
	floatingLabel,
	onBlur,
	onFocus,
	onInvalid,
	...props
}: InputFieldProps) => {
	const { t } = useTranslation();
	const [showPassword, setShowPassword] = useState(false);
	const [errorState, setErrorState] = useState<
		| { kind: "required" }
		| { kind: "invalidEmail" }
		| { kind: "tooShort"; count: number }
		| { kind: "tooLong"; count: number }
		| { kind: "patternMismatch"; title: string }
		| { kind: "custom"; message: string }
		| null
	>(null);
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const isPassword = type === "password";
	const inputType = isPassword && showPassword ? "text" : type;
	const isFloating = floatingLabel !== false && !label && !!placeholder;
	const labelText = label || placeholder;

	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		const input = inputRef.current;
		const start = input?.selectionStart ?? 0;
		const end = input?.selectionEnd ?? 0;
		setShowPassword((prev) => !prev);
		requestAnimationFrame(() => {
			const input = inputRef.current;
			if (!input) return;
			input.focus();
			input.setSelectionRange(start, end);
		});
	};

	const getValidationState = (input: HTMLInputElement): typeof errorState => {
		if (input.validity.valueMissing) return { kind: "required" };
		if (input.validity.typeMismatch && type === "email")
			return { kind: "invalidEmail" };
		if (input.validity.tooShort)
			return { kind: "tooShort", count: input.minLength };
		if (input.validity.tooLong)
			return { kind: "tooLong", count: input.maxLength };
		if (input.validity.patternMismatch)
			return { kind: "patternMismatch", title: input.title };
		return { kind: "custom", message: input.validationMessage };
	};

	const resolveErrorMessage = (): string => {
		if (error) return error;
		if (!errorState) return "";
		switch (errorState.kind) {
			case "required":
				return t("formValidation.required");
			case "invalidEmail":
				return t("formValidation.invalidEmail");
			case "tooShort":
				return t("formValidation.tooShort", { count: errorState.count });
			case "tooLong":
				return t("formValidation.tooLong", { count: errorState.count });
			case "patternMismatch":
				return errorState.title || t("formValidation.patternMismatch");
			case "custom":
				return errorState.message;
		}
	};

	const visibleError = resolveErrorMessage();

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setIsFocused(false);
		const input = e.currentTarget;
		if (!input.checkValidity()) {
			setErrorState(getValidationState(input));
		}
		onBlur?.(e);
	};

	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		setIsFocused(true);
		setErrorState(null);
		onFocus?.(e);
	};

	const handleInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
		e.preventDefault();
		setErrorState(getValidationState(e.currentTarget));
		onInvalid?.(e);
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
	};

	return (
		<div className={`input-field-container ${className}`.trim()}>
			{label && (
				<label htmlFor={id} className="text-label">
					{label}
				</label>
			)}
			<div
				className={[
					"input-wrapper",
					isFloating && "floating",
					visibleError && "error",
				]
					.filter(Boolean)
					.join(" ")}
			>
				<input
					ref={inputRef}
					id={id}
					className="input-field text-body3"
					type={inputType}
					placeholder={isFloating ? " " : placeholder}
					aria-invalid={visibleError ? "true" : "false"}
					aria-describedby={
						visibleError ? `${id}-error` : hint ? `${id}-hint` : undefined
					}
					onBlur={handleBlur}
					onFocus={handleFocus}
					onInvalid={handleInvalid}
					{...props}
				/>
				{isFloating && (
					<label htmlFor={id} className="floating-label">
						{labelText}
					</label>
				)}

				{isPassword && (
					<IconButton
						className="eye"
						type="button"
						onMouseDown={handleMouseDown}
						onClick={handleClick}
						aria-label={
							showPassword
								? t("ariaLabels.hidePassword")
								: t("ariaLabels.showPassword")
						}
					>
						{showPassword ? <EyeClosed /> : <Eye />}
					</IconButton>
				)}
			</div>

			{visibleError ? (
				<p id={`${id}-error`} className="text-caption-s error-message">
					{visibleError}
				</p>
			) : isFocused && hint ? (
				<p id={`${id}-hint`} className="text-caption-s input-message">
					{hint}
				</p>
			) : null}
		</div>
	);
};
