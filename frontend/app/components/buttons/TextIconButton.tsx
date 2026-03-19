import type { ReactNode } from "react";
import "../../assets/styles/textIconButton.css";
import { Link } from "react-router";

type TextButtonVariant = "primary" | "inverted";

interface TextButtonProps {
	children: ReactNode;
	to?: string;
	onClick?: () => void;
	size?: "body1" | "body2";
	className?: string;
	variant?: TextButtonVariant;
}

export const TextIconButton = ({
	children,
	to,
	onClick,
	size = "body1",
	variant = "primary",
	className = "",
}: TextButtonProps) => {
	const combinedClasses =
		`text-button text-button--${size} ${variant} ${className}`.trim();

	if (to) {
		return (
			<Link to={to} className={combinedClasses} onClick={onClick}>
				{children}
			</Link>
		);
	}

	return (
		<button type="button" onClick={onClick} className={combinedClasses}>
			{children}
		</button>
	);
};
