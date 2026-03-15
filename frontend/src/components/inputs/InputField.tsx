import type { InputHTMLAttributes } from "react";
import { useRef, useState } from "react";
import "../../assets/styles/inputField.css";
import { Eye, EyeClosed } from "iconoir-react";
import { IconButton } from "../buttons/IconButton";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	hint?: string;
	error?: string;
};

export const InputField = ({
	className = "",
	type = "text",
	placeholder = "",
	label,
	hint,
	error,
	id,
	...props
}: InputFieldProps) => {
	const [showPassword, setShowPassword] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
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
	const isPassword = type === "password";
	const inputType = isPassword && showPassword ? "text" : type;

	return (
		<div className={`input-field-container ${className}`.trim()}>
			<label htmlFor={id} className={label ? "text-caption" : "sr-only"}>
				{label || placeholder || "Input field"}
			</label>

			<div className={`input-wrapper ${error ? "error" : ""}`}>
				<input
					ref={inputRef}
					id={id}
					className="input-field"
					type={inputType}
					placeholder={placeholder}
					{...props}
				/>

				{isPassword && (
					<IconButton className="eye" type="button" onClick={handleClick}>
						{showPassword ? <EyeClosed /> : <Eye />}
					</IconButton>
				)}
			</div>

			{error ? (
				<p className="text-caption-s error-message">{error}</p>
			) : hint ? (
				<p className="text-caption-s input-message">{hint}</p>
			) : null}
		</div>
	);
};
