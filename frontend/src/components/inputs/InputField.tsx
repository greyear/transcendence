import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import "../../assets/styles/inputField.css";
import { Eye, EyeClosed } from "iconoir-react";
import { IconButton } from "../buttons/IconButton";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement>;

export const InputField = ({
	className = "",
	type = "text",
	placeholder = "",
	...props
}: InputFieldProps) => {
	const [isActive, setIsActive] = useState(false);

	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		e.preventDefault();
		setIsActive((prev) => !prev);
	};
	const isPassword = type === "password";
	const inputType = isPassword && isActive ? "text" : type;

	return (
		<div className={`input-wrapper ${className}`.trim()}>
			<input
				className={`input-field ${isPassword ? "password" : ""}`}
				type={inputType}
				placeholder={placeholder}
				{...props}
			/>

			{isPassword && (
				<IconButton className="eye" type="button" onClick={handleClick}>
					{isActive ? <EyeClosed /> : <Eye />}
				</IconButton>
			)}
		</div>
	);
};
