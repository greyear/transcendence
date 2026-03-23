import type { InputHTMLAttributes } from "react";
import { useRef, useState } from "react";
import "../../assets/styles/inputField.css";
import { Eye, EyeClosed } from "iconoir-react";
import { IconButton } from "../buttons/IconButton";

type BaseProps = Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
	id: string;
	hint?: string;
	error?: string;
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
	onBlur,
	onFocus,
	onInvalid,
	...props
}: InputFieldProps) => {
	const [showPassword, setShowPassword] = useState(false);
	const [visibleError, setVisibleError] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const isPassword = type === "password";
	const inputType = isPassword && showPassword ? "text" : type;

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

	const getValidationMessage = (input: HTMLInputElement) => {
		if (error) return error;
		if (input.validity.valueMissing) return "This field is required.";
		if (input.validity.typeMismatch && type === "email")
			return "Please enter a valid email address.";
		if (input.validity.tooShort)
			return `Please enter at least ${input.minLength} characters.`;
		if (input.validity.tooLong)
			return `Please enter no more than ${input.maxLength} characters.`;
		if (input.validity.patternMismatch)
			return "Please match the requested format.";
		return input.validationMessage;
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		const input = e.currentTarget;
		if (!input.checkValidity()) {
			setVisibleError(getValidationMessage(input));
		}
		onBlur?.(e);
	};

	const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
		setVisibleError("");
		onFocus?.(e);
	};

	const handleInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
		e.preventDefault();
		setVisibleError(getValidationMessage(e.currentTarget));
		onInvalid?.(e);
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
	};

	return (
		<div className={`input-field-container ${className}`.trim()}>
			<label htmlFor={id} className={label ? "text-label" : "sr-only"}>
				{label || placeholder}
			</label>

			<div className={`input-wrapper ${visibleError ? "error" : ""}`.trim()}>
				<input
					ref={inputRef}
					id={id}
					className="input-field text-body3"
					type={inputType}
					placeholder={placeholder}
					aria-invalid={visibleError ? "true" : "false"}
					aria-describedby={
						visibleError ? `${id}-error` : hint ? `${id}-hint` : undefined
					}
					onBlur={handleBlur}
					onFocus={handleFocus}
					onInvalid={handleInvalid}
					{...props}
				/>

				{isPassword && (
					<IconButton
						className="eye"
						type="button"
						onMouseDown={handleMouseDown}
						onClick={handleClick}
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? <EyeClosed /> : <Eye />}
					</IconButton>
				)}
			</div>

			{visibleError ? (
				<p id={`${id}-error`} className="text-caption-s error-message">
					{visibleError}
				</p>
			) : hint ? (
				<p id={`${id}-hint`} className="text-caption-s input-message">
					{hint}
				</p>
			) : null}
		</div>
	);
};
