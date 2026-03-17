import { RemixI18Next } from "remix-i18next/server";
import i18n from "./i18n";
import resources from "./locales";

export const localeCookie = {
	serialize: (value: string) =>
		`i18next=${value}; Path=/; SameSite=Lax; Max-Age=${365 * 24 * 60 * 60}`,
};

const i18next = new RemixI18Next({
	detection: {
		supportedLanguages: i18n.supportedLngs,
		fallbackLanguage: i18n.fallbackLng,
		findLocale: async (request) => {
			const cookie = request.headers.get("Cookie") ?? "";
			const match = cookie.match(/(?:^|;)\s*i18next=([^;]*)/);
			return match?.[1] ?? i18n.fallbackLng;
		},
	},
	i18next: { ...i18n, resources },
});

export default i18next;
