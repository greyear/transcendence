import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import "../../assets/styles/mainButton.css";

type MainButtonVariant =
	| "primary"
	| "pill"
	| "danger"
	| "secondary"
	| "inverted";

interface MainButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: MainButtonVariant;
	active?: boolean;
	to?: string;
}

export const MainButton = ({
	children,
	className = "",
	variant = "primary",
	active = false,
	to,
	...props
}: MainButtonProps) => {
	const combinedClasses =
		`main-button ${variant} ${active ? "active" : ""} ${className}`.trim();

	if (to) {
		return (
			<Link to={to} className={combinedClasses}>
				{children}
			</Link>
		);
	}

	return (
		<button className={combinedClasses} {...props}>
			{children}
		</button>
	);
};
