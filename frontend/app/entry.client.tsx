import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import i18nConfig from "./i18n";
import resources from "./locales";

const main = async () => {
	await i18n
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			...i18nConfig,
			resources,
			detection: {
				order: ["cookie", "htmlTag"],
				caches: ["cookie"],
				lookupCookie: "i18next",
				cookieMinutes: 365 * 24 * 60,
				cookieOptions: { path: "/", sameSite: "lax" },
			},
		});

	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<I18nextProvider i18n={i18n}>
					<HydratedRouter />
				</I18nextProvider>
			</StrictMode>,
		);
	});
};

main().catch((error) => console.error(error));
