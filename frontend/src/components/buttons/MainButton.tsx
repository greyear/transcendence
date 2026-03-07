import type { ButtonHTMLAttributes, ReactNode } from "react";
import "../../assets/styles/mainButton.css";

interface MainButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
}

export const MainButton = ({
	children,
	className = "",
	...props
}: MainButtonProps) => {
	return (
		<button className={`main-button ${className}`.trim()} {...props}>
			{children}
		</button>
	);
};
