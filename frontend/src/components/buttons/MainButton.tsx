import type { ButtonHTMLAttributes, ReactNode } from "react";
import "../../assets/styles/mainButton.css";

type MainButtonVariant =
	| "primary"
	| "pill"
	| "danger"
	| "secondary";

interface MainButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: MainButtonVariant;
	active?: boolean;
}

export function MainButton({
	children,
	variant = "primary",
	active = false,
	...props
}: MainButtonProps) {

	return (
		<button
			className={`main-button ${variant} ${active ? "active" : ""}`}
			{...props}
		>
			{children}
		</button>
	);
}
