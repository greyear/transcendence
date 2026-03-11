import type { ReactNode } from "react";
import "../../assets/styles/textIconButton.css";
import { Link } from "react-router-dom";

interface TextButtonProps {
	children: ReactNode;
	to?: string;
	onClick?: () => void;
	size?: "body1" | "body2";
	className?: string;
}

export const TextIconButton = ({
	children,
	to,
	onClick,
	size = "body1",
	className = "",
}: TextButtonProps) => {
	const combinedClasses =
		`text-button text-button--${size} ${className}`.trim();

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
