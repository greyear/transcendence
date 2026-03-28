import type { LangCodes } from "../LanguageSelector";
import "../../assets/styles/languageSelector.css";
import { IconButton } from "./IconButton";

interface LangButtonProps {
	langCode: LangCodes;
	isActive: boolean;
	isHeader: boolean;
	onClick: () => void;
}

export const LanguageButton = ({
	langCode,
	isActive,
	isHeader,
	onClick,
}: LangButtonProps) => {
	const activeClass = isActive ? "active" : "";
	const location = isHeader ? "header" : "footer";
	return (
		<IconButton
			onClick={onClick}
			className={`language-button--${location} ${activeClass}`}
			aria-pressed={isActive}
			variant="language"
		>
			{langCode}
		</IconButton>
	);
};
