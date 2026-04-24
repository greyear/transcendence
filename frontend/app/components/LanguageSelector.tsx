import { useTranslation } from "react-i18next";
import { IconButton } from "./buttons/IconButton";
import { LanguageButton } from "./buttons/LanguageButton";
import "../assets/styles/languageSelector.css";
import { NavArrowDown } from "iconoir-react";
import type { HTMLAttributes } from "react";
import { useEffect, useId, useRef, useState } from "react";
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
	const { i18n, t } = useTranslation();
	const classNames = `language-list ${className}`.trim();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const menuId = useId();

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

		return handleDropdownClose(dropdown, setIsOpen);
	}, [variant]);

	useEffect(() => {
		if (variant !== "dropdown" || !isOpen) {
			return;
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			setIsOpen(false);
			const trigger = dropdownRef.current?.querySelector<HTMLButtonElement>(
				".language-dropdown__trigger",
			);
			trigger?.focus();
		};

		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [variant, isOpen]);

	if (variant === "dropdown") {
		return (
			<div className="language-dropdown" ref={dropdownRef}>
				<IconButton
					className="language-button--header language-dropdown__trigger"
					variant="language"
					aria-expanded={isOpen}
					aria-haspopup="menu"
					aria-controls={menuId}
					aria-label={t("ariaLabels.languageMenu")}
					onClick={() => setIsOpen((prev) => !prev)}
				>
					<span lang={i18n.resolvedLanguage}>{i18n.resolvedLanguage}</span>
					<NavArrowDown
						className={`language-dropdown__chevron${isOpen ? " language-dropdown__chevron--open" : ""}`}
					/>
				</IconButton>
				{isOpen && (
					<div
						id={menuId}
						role="menu"
						aria-label={t("ariaLabels.languageMenu")}
						className="language-dropdown__menu"
					>
						{languages.map((langCode) => (
							<div key={langCode} className="language-dropdown__menu-item">
								<LanguageButton
									langCode={langCode}
									isHeader={isHeader}
									isActive={i18n.resolvedLanguage === langCode}
									onClick={() => handleLanguageButtonClick(langCode)}
									className="language-dropdown__button"
									menuItemRole="menuitemradio"
								/>
							</div>
						))}
					</div>
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
