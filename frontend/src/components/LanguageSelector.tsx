import { useTranslation } from "react-i18next";
import { LanguageButton } from "./buttons/LanguageButton";
import "../assets/styles/languageSelector.css";
import type { HTMLAttributes } from "react";

export type LangCodes = "en" | "fi" | "ru";
const languages: LangCodes[] = ["en", "fi", "ru"];

interface LanguageSelectorProps extends HTMLAttributes<HTMLUListElement> {
	isHeader: boolean;
}

export const LanguageSelector = ({ isHeader }: LanguageSelectorProps) => {
	const { i18n } = useTranslation();

	return (
		<ul className="language-list">
			{languages.map((langCode) => (
				<li key={langCode} className="language-list-item">
					<LanguageButton
						langCode={langCode}
						isHeader={isHeader}
						isActive={i18n.language === langCode}
						onClick={() => i18n.changeLanguage(langCode)}
					/>
				</li>
			))}
		</ul>
	);
};
