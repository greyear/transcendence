import type { LangCodes } from "../LanguageSelector";
import "../../assets/styles/languageSelector.css";

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
		<button
			type="button"
			onClick={onClick}
			className={`icon-button language-button language-button--${location} ${activeClass}`}
			aria-pressed={isActive}
		>
			{langCode}
		</button>
	);
};
