import type { ReactNode } from "react";
import "../../assets/styles/textIconButton.css";
import { Link } from "react-router";

type TextButtonVariant = "primary" | "inverted";

interface TextButtonProps {
	children: ReactNode;
	to?: string;
	onClick?: () => void;
	size?: "body1" | "body2" | "body3";
	className?: string;
	variant?: TextButtonVariant;
	selected?: boolean;
	disabled?: boolean;
}

export const TextIconButton = ({
	children,
	to,
	onClick,
	size = "body1",
	variant = "primary",
	className = "",
	selected = false,
	disabled = false,
}: TextButtonProps) => {
	const combinedClasses =
		`text-button text-button--${size} ${variant} ${selected ? "text-selected" : ""} ${disabled ? "is-disabled" : ""} ${className}`.trim();

	if (to) {
		return (
			<Link
				to={to}
				className={combinedClasses}
				onClick={(event) => {
					if (disabled) {
						event.preventDefault();
						return;
					}

					onClick?.();
				}}
				aria-pressed={selected}
				aria-disabled={disabled}
				tabIndex={disabled ? -1 : undefined}
			>
				{children}
			</Link>
		);
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className={combinedClasses}
			aria-pressed={selected}
			disabled={disabled}
		>
			{children}
		</button>
	);
};
