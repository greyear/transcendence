import type { Resource } from "i18next";
import en from "./en/translation.json";
import fi from "./fi/translation.json";
import ru from "./ru/translation.json";

export default {
	en: { translation: en },
	fi: { translation: fi },
	ru: { translation: ru },
} satisfies Resource;
