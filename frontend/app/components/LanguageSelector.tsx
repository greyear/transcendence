import { useTranslation } from "react-i18next";
import { LanguageButton } from "./buttons/LanguageButton";
import { IconButton } from "./buttons/IconButton";
import "../assets/styles/languageSelector.css";
import type { HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { useScreenSize } from "~/composables/useScreenSize";
import { NavArrowDown } from "iconoir-react";
import { handleDropdowClose } from "~/composables/closeDropdownHandler";

export type LangCodes = "en" | "fi" | "ru";
const languages: LangCodes[] = ["en", "fi", "ru"];

interface LanguageSelectorProps extends HTMLAttributes<HTMLUListElement> {
	isHeader: boolean;
}

export const LanguageSelector = ({
	isHeader,
	className = "",
	...props
}: LanguageSelectorProps) => {
	const { i18n } = useTranslation();
	const { screenSize } = useScreenSize();
	const classNames = `language-list ${className}`.trim();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleLanguageButtonClick = (langCode: LangCodes) => {
		i18n.changeLanguage(langCode);
		setIsOpen(false);
	};

	useEffect(() => {
		if (screenSize !== "desktop") {
			return;
		}

		const dropdown = dropdownRef.current;
		if (!dropdown) {
			return;
		}

		handleDropdowClose(dropdown, setIsOpen);
	}, [screenSize]);

	if (screenSize === "desktop") {
		return (
			<div className="language-dropdown" ref={dropdownRef}>
				<IconButton
					className="language-button--header language-dropdown__trigger"
					variant="language"
					aria-expanded={isOpen}
					aria-haspopup="listbox"
					onClick={() => setIsOpen((prev) => !prev)}
				>
					{i18n.resolvedLanguage}
					<NavArrowDown
						className={`language-dropdown__chevron${isOpen ? " language-dropdown__chevron--open" : ""}`}
					/>
				</IconButton>
				{isOpen && (
					<ul className="language-dropdown__menu" role="listbox">
						{languages.map((langCode) => (
							<li
								key={langCode}
								className="language-dropdown__menu-item"
								role="option"
								aria-selected={i18n.resolvedLanguage === langCode}
							>
								<LanguageButton
									langCode={langCode}
									isHeader={isHeader}
									isActive={i18n.resolvedLanguage === langCode}
									onClick={() => handleLanguageButtonClick(langCode)}
								/>
							</li>
						))}
					</ul>
				)}
			</div>
		);
	}

	return (
		<ul className={classNames} {...props}>
			{languages.map((langCode) => (
				<li key={langCode} className="language-list-item">
					<LanguageButton
						langCode={langCode}
						isHeader={isHeader}
						isActive={i18n.resolvedLanguage === langCode}
						onClick={() => handleLanguageButtonClick(langCode)}
					/>
				</li>
			))}
		</ul>
	);
};
