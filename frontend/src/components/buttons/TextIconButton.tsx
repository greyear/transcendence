import type { ReactNode } from "react";
import "../../assets/styles/textIconButton.css";

interface TextButtonProps {
	children: ReactNode;
	href?: string; // replace by "to" when router is set up
	onClick?: () => void;
	size?: "body1" | "body2";
	className?: string;
}

export const TextIconButton = ({
	children,
	href,
	onClick,
	size = "body1",
	className = "",
}: TextButtonProps) => {
	const combinedClasses = `text-button text-button--${size} ${className}`;

	if (href) {
		return (
			<a href={href} className={combinedClasses}>
				{children}
			</a>
		);
	}

	return (
		<button type="button" onClick={onClick} className={combinedClasses}>
			{children}
		</button>
	);
};
