import { useTranslation } from "react-i18next";
import { LanguageButton } from "./buttons/LanguageButton";
import "../assets/styles/languageSelector.css";
import type { HTMLAttributes } from "react";
import { useFetcher } from "react-router";

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
	const classNames = `language-list ${className}`.trim();
	const fetcher = useFetcher();

	const handleLanguageButtonClick = (langCode: LangCodes) => {
		i18n.changeLanguage(langCode);
		fetcher.submit(
			{ locale: langCode },
			{ method: "POST", action: "/set-locale" }
		);
	};

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
