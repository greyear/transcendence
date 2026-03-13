import type { LangCodes } from "../LanguageSelector";

interface LangButtonProps {
	langCode: LangCodes;
	isActive: boolean;
	onClick: () => void;
}

export const LanguageButton = ({
	langCode,
	isActive,
	onClick,
}: LangButtonProps) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`icon-button ${isActive ? "active" : ""} `}
		>
			{langCode}
		</button>
	);
};
