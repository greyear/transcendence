import type { ButtonHTMLAttributes, ReactNode } from "react";
import "../../assets/styles/iconButton.css";

type IconButtonVariants = "default" | "transparent" | "language";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: IconButtonVariants;
}

export const IconButton = ({
	children,
	className = "",
	variant = "default",
	...props
}: IconButtonProps) => {
	return (
		<button
			type="button"
			className={`icon-button ${variant} ${className}`.trim()}
			{...props}
		>
			{children}
		</button>
	);
};
