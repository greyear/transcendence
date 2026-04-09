import type { Request } from "express";
import {
	DEFAULT_LOCALE,
	type SupportedLocale,
	validateLocale,
} from "../validation/schemas.js";

/**
 * Extract the first language token from an HTTP Accept-Language style header.
 *
 * Examples:
 * - "fi-FI,fi;q=0.9,en;q=0.8" -> "fi"
 * - "ru" -> "ru"
 *
 * Returns null when the header is missing or does not contain a usable token.
 */
const parseLanguageHeader = (value: unknown): string | null => {
	if (typeof value !== "string") {
		return null;
	}

	const firstToken = value.split(",")[0]?.split(";")[0]?.trim().toLowerCase();
	if (!firstToken) {
		return null;
	}

	const normalized = firstToken.slice(0, 2);
	return normalized.length === 2 ? normalized : null;
};

/**
 * Resolve the locale requested by the client.
 *
 * Priority order:
 * 1. `?lang=` query parameter
 * 2. `X-Language` request header
 * 3. DEFAULT_LOCALE fallback
 */
export const resolveRequestedLocale = (req: Request): SupportedLocale => {
	const queryLocaleRaw = req.query.lang;
	const queryLocaleValue =
		typeof queryLocaleRaw === "string" ? queryLocaleRaw.toLowerCase() : null;

	if (queryLocaleValue) {
		const parsed = validateLocale(queryLocaleValue);
		if (parsed.valid) {
			return parsed.value;
		}
	}

	const headerLocale = parseLanguageHeader(req.headers["x-language"]);
	if (headerLocale) {
		const parsed = validateLocale(headerLocale);
		if (parsed.valid) {
			return parsed.value;
		}
	}

	return DEFAULT_LOCALE;
};
