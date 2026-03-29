import { useTranslation } from "react-i18next";
import { IconButton } from "./buttons/IconButton";
import { LanguageButton } from "./buttons/LanguageButton";
import "../assets/styles/languageSelector.css";
import { NavArrowDown } from "iconoir-react";
import type { HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { handleDropdownClose } from "~/composables/closeDropdownHandler";

export type LangCodes = "en" | "fi" | "ru";
const languages: LangCodes[] = ["en", "fi", "ru"];

export type LanguageSelectorVariant = "default" | "dropdown";

interface LanguageSelectorProps extends HTMLAttributes<HTMLUListElement> {
	isHeader: boolean;
	variant?: LanguageSelectorVariant;
}

export const LanguageSelector = ({
	isHeader,
	variant = "default",
	className = "",
	...props
}: LanguageSelectorProps) => {
	const { i18n } = useTranslation();
	const classNames = `language-list ${className}`.trim();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const handleLanguageButtonClick = (langCode: LangCodes) => {
		i18n.changeLanguage(langCode);
		setIsOpen(false);
	};

	useEffect(() => {
		if (variant !== "dropdown") {
			return;
		}

		const dropdown = dropdownRef.current;
		if (!dropdown) {
			return;
		}

		handleDropdownClose(dropdown, setIsOpen);
	}, [variant]);

	if (variant === "dropdown") {
		return (
			<div className="language-dropdown" ref={dropdownRef}>
				<IconButton
					className="language-button--header language-dropdown__trigger"
					variant="language"
					aria-expanded={isOpen}
					aria-haspopup="true"
					onClick={() => setIsOpen((prev) => !prev)}
				>
					{i18n.resolvedLanguage}
					<NavArrowDown
						className={`language-dropdown__chevron${isOpen ? " language-dropdown__chevron--open" : ""}`}
					/>
				</IconButton>
				{isOpen && (
					<ul className="language-dropdown__menu">
						{languages.map((langCode) => (
							<li
								key={langCode}
								className="language-dropdown__menu-item"
								role="none"
							>
								<LanguageButton
									langCode={langCode}
									isHeader={isHeader}
									isActive={i18n.resolvedLanguage === langCode}
									onClick={() => handleLanguageButtonClick(langCode)}
									className="language-dropdown__button"
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
