import { useTranslation } from "react-i18next";
import { IconButton } from "./buttons/IconButton";
import { LanguageButton } from "./buttons/LanguageButton";
import "../assets/styles/languageSelector.css";
import { NavArrowDown } from "iconoir-react";
import type { HTMLAttributes, KeyboardEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
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
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const [activeIndex, setActiveIndex] = useState(0);
	const menuId = useId();

	const focusTrigger = useCallback(() => {
		triggerRef.current?.focus();
	}, []);

	const handleLanguageButtonClick = (langCode: LangCodes) => {
		i18n.changeLanguage(langCode);
		setIsOpen(false);
		if (variant === "dropdown") {
			focusTrigger();
		}
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

		const resolved = i18n.resolvedLanguage;
		const langStrings: readonly string[] = languages;
		const currentIndex = resolved ? langStrings.indexOf(resolved) : -1;
		const startIndex = currentIndex >= 0 ? currentIndex : 0;
		setActiveIndex(startIndex);
		requestAnimationFrame(() => {
			optionRefs.current[startIndex]?.focus();
		});
	}, [variant, isOpen, i18n.resolvedLanguage]);

	useEffect(() => {
		if (variant !== "dropdown" || !isOpen) {
			return;
		}

		const handleEscape = (event: globalThis.KeyboardEvent) => {
			if (event.key !== "Escape") {
				return;
			}

			setIsOpen(false);
			focusTrigger();
		};

		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [variant, isOpen, focusTrigger]);

	const focusOption = (index: number) => {
		setActiveIndex(index);
		optionRefs.current[index]?.focus();
	};

	const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				focusOption((activeIndex + 1) % languages.length);
				break;
			case "ArrowUp":
				event.preventDefault();
				focusOption((activeIndex - 1 + languages.length) % languages.length);
				break;
			case "Home":
				event.preventDefault();
				focusOption(0);
				break;
			case "End":
				event.preventDefault();
				focusOption(languages.length - 1);
				break;
			case "Tab":
				setIsOpen(false);
				break;
			default:
				break;
		}
	};

	if (variant === "dropdown") {
		return (
			<div className="language-dropdown" ref={dropdownRef}>
				<IconButton
					ref={triggerRef}
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
						{languages.map((langCode, index) => (
							<div key={langCode} className="language-dropdown__menu-item">
								<LanguageButton
									ref={(element) => {
										optionRefs.current[index] = element;
									}}
									langCode={langCode}
									isHeader={isHeader}
									isActive={i18n.resolvedLanguage === langCode}
									onClick={() => handleLanguageButtonClick(langCode)}
									className="language-dropdown__button"
									menuItemRole="menuitemradio"
									tabIndex={index === activeIndex ? 0 : -1}
									onKeyDown={handleOptionKeyDown}
									onFocus={() => setActiveIndex(index)}
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
