import { useTranslation } from "react-i18next";
import { LanguageButton } from "./buttons/LanguageButton";
import "../assets/styles/languageSelector.css";

export type LangCodes = "en" | "fi" | "ru";
const languages: LangCodes[] = ["en", "fi", "ru"];

export const LanguageSelector = () => {
	const { i18n } = useTranslation();

	return (
		<ul className="language-list">
			{languages.map((langCode) => (
				<li key={langCode} className="language-list-item">
					<LanguageButton
						langCode={langCode}
						isActive={i18n.language === langCode}
						onClick={() => i18n.changeLanguage(langCode)}
					/>
				</li>
			))}
		</ul>
	);
};
