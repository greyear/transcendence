import type { MouseEventHandler, ReactNode } from "react";
import "../../assets/styles/iconButton.css";
import { Link } from "react-router";

type IconButtonVariants = "default" | "transparent" | "language";

type IconButtonProps = {
	children: ReactNode;
	variant?: IconButtonVariants;
	className?: string;
	to?: string;
	onClick?: MouseEventHandler<HTMLElement>;
	onMouseDown?: MouseEventHandler<HTMLElement>;
	"aria-expanded"?: boolean;
	"aria-haspopup"?: boolean | "true" | "false";
	"aria-label"?: string;
	"aria-pressed"?: boolean | "mixed";
	"data-initial-focus"?: boolean;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
};

export const IconButton = ({
	children,
	className = "",
	variant = "default",
	to,
	onClick,
	onMouseDown,
	"aria-expanded": ariaExpanded,
	"aria-haspopup": ariaHaspopup,
	"aria-label": ariaLabel,
	"aria-pressed": ariaPressed,
	"data-initial-focus": dataInitialFocus,
	disabled = false,
	type = "button",
}: IconButtonProps) => {
	const combinedClasses = `icon-button ${variant} ${className}`.trim();

	if (to) {
		return (
			<Link
				to={to}
				className={combinedClasses}
				onClick={onClick}
				aria-expanded={ariaExpanded}
				aria-haspopup={ariaHaspopup}
				aria-label={ariaLabel}
				aria-pressed={ariaPressed}
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
			onMouseDown={onMouseDown}
			aria-expanded={ariaExpanded}
			aria-haspopup={ariaHaspopup}
			aria-label={ariaLabel}
			aria-pressed={ariaPressed}
			data-initial-focus={dataInitialFocus}
			disabled={disabled}
		>
			{children}
		</button>
	);
};
