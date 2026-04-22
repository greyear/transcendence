import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router";
import "../../assets/styles/mainButton.css";

type MainButtonVariant =
	| "primary"
	| "pill"
	| "danger"
	| "secondary"
	| "inverted";

type MainButtonProps = {
	children: ReactNode;
	variant?: MainButtonVariant;
	active?: boolean;
	className?: string;
	to?: string;
	onClick?: MouseEventHandler<HTMLElement>;
	"aria-label"?: string;
	"aria-busy"?: boolean;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
};

export const MainButton = ({
	children,
	className = "",
	variant = "primary",
	active = false,
	to,
	onClick,
	"aria-label": ariaLabel,
	"aria-busy": ariaBusy,
	disabled = false,
	type = "button",
}: MainButtonProps) => {
	const combinedClasses =
		`main-button ${variant} ${active ? "active" : ""} ${className}`.trim();

	if (to) {
		return (
			<Link
				to={to}
				className={combinedClasses}
				onClick={onClick}
				aria-label={ariaLabel}
				aria-busy={ariaBusy}
			>
				{children}
			</Link>
		);
	}

	return (
		<button
			type={type}
			className={combinedClasses}
			onClick={onClick}
			aria-label={ariaLabel}
			aria-busy={ariaBusy}
			disabled={disabled}
		>
			{children}
		</button>
	);
};
