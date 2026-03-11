import type { LangCodes } from "../../pages/HomePage";

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
