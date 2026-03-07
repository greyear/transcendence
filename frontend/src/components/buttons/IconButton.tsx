import type { ButtonHTMLAttributes, ReactNode } from "react";
import "../../assets/styles/iconButton.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
}

export const IconButton = ({
	children,
	className = "",
	...props
}: IconButtonProps) => {
	return (
		<button className={`icon-button ${className}`.trim()} {...props}>
			{children}
		</button>
	);
};
