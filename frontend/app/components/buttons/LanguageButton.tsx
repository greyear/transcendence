import type { LangCodes } from "../LanguageSelector";
import "../../assets/styles/languageSelector.css";
import { IconButton } from "./IconButton";

interface LangButtonProps {
	langCode: LangCodes;
	isActive: boolean;
	isHeader: boolean;
	onClick: () => void;
	className?: string;
	menuItemRole?: "menuitemradio";
}

export const LanguageButton = ({
	langCode,
	isActive,
	isHeader,
	onClick,
	className = "",
	menuItemRole,
}: LangButtonProps) => {
	const activeClass = isActive ? "active" : "";
	const location = isHeader ? "header" : "footer";
	const isMenuItem = menuItemRole === "menuitemradio";

	return (
		<IconButton
			onClick={onClick}
			className={`language-button--${location} ${activeClass} ${className}`.trim()}
			variant="language"
			role={isMenuItem ? "menuitemradio" : undefined}
			aria-checked={isMenuItem ? isActive : undefined}
			aria-pressed={isMenuItem ? undefined : isActive}
			lang={langCode}
		>
			{langCode}
		</IconButton>
	);
};
