import type { KeyboardEvent, Ref } from "react";
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
	tabIndex?: number;
	onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
	onFocus?: () => void;
	ref?: Ref<HTMLButtonElement>;
}

export const LanguageButton = ({
	langCode,
	isActive,
	isHeader,
	onClick,
	className = "",
	menuItemRole,
	tabIndex,
	onKeyDown,
	onFocus,
	ref,
}: LangButtonProps) => {
	const activeClass = isActive ? "active" : "";
	const location = isHeader ? "header" : "footer";
	const isMenuItem = menuItemRole === "menuitemradio";

	return (
		<IconButton
			ref={ref}
			onClick={onClick}
			onKeyDown={onKeyDown}
			onFocus={onFocus}
			tabIndex={tabIndex}
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
