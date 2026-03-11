import type { ButtonHTMLAttributes, ReactNode } from "react";
import "../../assets/styles/mainButton.css";

type MainButtonVariant = "primary" | "pill" | "danger" | "secondary";

interface MainButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: MainButtonVariant;
	active?: boolean;
}

export const MainButton = ({
	children,
	className = "",
	variant = "primary",
	active = false,
	...props
}: MainButtonProps) => {
	return (
		<button
			className={`main-button ${variant} ${active ? "active" : ""} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
};
