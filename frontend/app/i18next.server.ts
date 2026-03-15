import { RemixI18Next } from "remix-i18next/server";
import i18n from "./i18n";
import resources from "./locales";
import { createCookie } from "react-router";

export const localeCookie = createCookie("i18next", {
	path: "/",
	sameSite: "lax",
	httpOnly: false,
	maxAge: 31_536_000,
});

const i18next = new RemixI18Next({
	detection: {
		supportedLanguages: i18n.supportedLngs,
		fallbackLanguage: i18n.fallbackLng,
		cookie: localeCookie
	},
	i18next: {
		...i18n,
		resources,
	},
});

export default i18next;
