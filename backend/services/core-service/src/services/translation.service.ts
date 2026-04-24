/**
 * Translation Service
 *
 * Handles automatic localization of recipe content (title, description, instructions)
 * from any source language to all supported locales (en, fi, ru).
 *
 * When a recipe is created/updated:
 * 1. User provides text in the selected source locale
 * 2. This service translates it to other locales (if external AI service is available)
 * 3. All 3 language versions are stored in JSONB: { en, fi, ru }
 * 4. When fetching, user gets the language they requested
 *
 * If translation service is unavailable → fallback to the source text for all languages
 */

import { DEFAULT_LOCALE, type SupportedLocale } from "../validation/schemas.js";

// Supported languages for recipe content
const SUPPORTED_TRANSLATION_LOCALES: SupportedLocale[] = ["en", "fi", "ru"];

// Configuration from environment (optional)
// Example: TRANSLATION_API_URL=http://localhost:3003/translate
// If not set, fallback will be used (source text for all languages)
const TRANSLATION_API_URL = process.env.TRANSLATION_API_URL;
const TRANSLATION_TIMEOUT_MS = Number(
	process.env.TRANSLATION_TIMEOUT_MS ?? 2500,
);
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.trim();

type TranslationApiResponse = {
	translations?: Partial<Record<SupportedLocale, string>>;
};

type BatchedTranslationApiResponse = {
	translations?:
		| Array<Partial<Record<SupportedLocale, string>>>
		| Partial<Record<SupportedLocale, string[]>>;
};

/**
 * Creates an AbortSignal for fetch timeout
 * Ensures translation requests don't hang indefinitely
 */
const timeoutSignal = (): AbortSignal => {
	return AbortSignal.timeout(TRANSLATION_TIMEOUT_MS);
};

/**
 * Fallback: returns the same text for all languages
 * Used when translation service is unavailable or times out
 */
const fallbackLocalizedText = (
	source: string,
): Record<SupportedLocale, string> => ({
	en: source,
	fi: source,
	ru: source,
});

/**
 * Validates and cleans translated text
 * Returns null if result is empty or not a string
 */
const sanitizeTranslation = (value: unknown): string | null => {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	if (normalized.length === 0) {
		return null;
	}

	return normalized;
};

/**
 * Builds target locale list by excluding the source locale.
 *
 * Example: source `fi` -> targets [`en`, `ru`].
 */
const getTargetLocales = (sourceLocale: SupportedLocale): SupportedLocale[] =>
	SUPPORTED_TRANSLATION_LOCALES.filter((locale) => locale !== sourceLocale);

/**
 * Normalizes supported batch response shapes to a per-item translation array.
 *
 * Supported input formats:
 * 1. Array shape: [{ fi: "...", ru: "..." }, ...]
 * 2. Locale map shape: { fi: ["..."], ru: ["..."] }
 */
const normalizeBatchedTranslations = (
	translations: unknown,
	expectedCount: number,
	sourceLocale: SupportedLocale,
): Array<Partial<Record<SupportedLocale, string>>> | null => {
	if (!translations) {
		return null;
	}

	if (Array.isArray(translations)) {
		if (translations.length !== expectedCount) {
			return null;
		}

		return translations.every((item) => item && typeof item === "object")
			? (translations as Array<Partial<Record<SupportedLocale, string>>>)
			: null;
	}

	if (typeof translations !== "object") {
		return null;
	}

	const batchPayload = translations as Partial<
		Record<SupportedLocale, string[]>
	>;
	const locales = getTargetLocales(sourceLocale);
	const lengths = locales.map((locale) => batchPayload[locale]?.length);

	if (lengths.some((length) => length !== expectedCount)) {
		return null;
	}

	return Array.from({ length: expectedCount }, (_, index) => {
		const entry: Partial<Record<SupportedLocale, string>> = {};
		for (const locale of locales) {
			const value = batchPayload[locale]?.[index];
			if (typeof value === "string") {
				entry[locale] = value;
			}
		}
		return entry;
	});
};

/**
 * Contacts external translation service
 * Expected to be a microservice compatible with this contract:
 *
 * POST TRANSLATION_API_URL
 * Request body: {
 *   source_language: "en",
 *   target_languages: ["fi", "ru"],
 *   text: "Text to translate"
 * }
 *
 * Response: {
 *   translations: {
 *     fi: "Finnish translation",
 *     ru: "Russian translation"
 *   }
 * }
 *
 * Returns null if:
 * - TRANSLATION_API_URL is not set
 * - Service returns non-200 status
 * - Response format is invalid
 * - Request times out
 */
const requestTranslations = async (
	sourceText: string,
	sourceLocale: SupportedLocale = DEFAULT_LOCALE,
): Promise<Partial<Record<SupportedLocale, string>> | null> => {
	// If no translation service is configured, skip external call
	if (!TRANSLATION_API_URL) {
		return null;
	}

	try {
		const response = await fetch(TRANSLATION_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(INTERNAL_SERVICE_TOKEN
					? { "X-Internal-Service-Token": INTERNAL_SERVICE_TOKEN }
					: {}),
			},
			body: JSON.stringify({
				source_language: sourceLocale,
				target_languages: getTargetLocales(sourceLocale),
				text: sourceText,
			}),
			signal: timeoutSignal(),
		});

		if (!response.ok) {
			console.warn(
				"Translation API request failed with status",
				response.status,
			);
			return null;
		}

		const data = (await response.json()) as TranslationApiResponse;
		if (!data.translations || typeof data.translations !== "object") {
			return null;
		}

		return data.translations;
	} catch (error) {
		console.warn(
			"Translation API is unavailable, fallback will be used:",
			error,
		);
		return null;
	}
};

/**
 * Best-effort batch translation helper.
 *
 * If the external API supports translating multiple texts in one request,
 * this reduces the number of HTTP calls for long instruction lists.
 * Otherwise callers should fall back to per-text requests.
 */
const requestBatchedTranslations = async (
	sourceTexts: string[],
	sourceLocale: SupportedLocale = DEFAULT_LOCALE,
): Promise<Array<Partial<Record<SupportedLocale, string>>> | null> => {
	if (!TRANSLATION_API_URL || sourceTexts.length === 0) {
		return null;
	}

	try {
		const response = await fetch(TRANSLATION_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(INTERNAL_SERVICE_TOKEN
					? { "X-Internal-Service-Token": INTERNAL_SERVICE_TOKEN }
					: {}),
			},
			body: JSON.stringify({
				source_language: sourceLocale,
				target_languages: getTargetLocales(sourceLocale),
				texts: sourceTexts,
			}),
			signal: timeoutSignal(),
		});

		if (!response.ok) {
			console.warn(
				"Translation API batch request failed with status",
				response.status,
			);
			return null;
		}

		const data = (await response.json()) as BatchedTranslationApiResponse;
		return normalizeBatchedTranslations(
			data.translations,
			sourceTexts.length,
			sourceLocale,
		);
	} catch (error) {
		console.warn(
			"Translation API batch request is unavailable, fallback will be used:",
			error,
		);
		return null;
	}
};

/**
 * Localizes one text value when the source language is explicitly known.
 *
 * Flow:
 * 1. Trim and clean source text
 * 2. Try to get translations from external service
 * 3. If no service or error → use fallback (source text for all)
 * 4. If translations partial → fill gaps with source text
 *
 * The source locale keeps original text, other locales use translated values
 * when available, otherwise fall back to source text.
 *
 * Returns: { en: "...", fi: "...", ru: "..." }
 */
export const localizeTextFromSource = async (
	sourceText: string,
	sourceLocale: SupportedLocale = DEFAULT_LOCALE,
): Promise<Record<SupportedLocale, string>> => {
	const safeSource = sourceText.trim();
	const fallback = fallbackLocalizedText(safeSource);
	const translations = await requestTranslations(safeSource, sourceLocale);

	// If no external translations available, return fallback
	if (!translations) {
		return fallback;
	}

	// Merge: prioritize translations, fill gaps with source text
	return {
		en:
			sourceLocale === "en"
				? safeSource
				: (sanitizeTranslation(translations.en) ?? safeSource),
		fi:
			sourceLocale === "fi"
				? safeSource
				: (sanitizeTranslation(translations.fi) ?? safeSource),
		ru:
			sourceLocale === "ru"
				? safeSource
				: (sanitizeTranslation(translations.ru) ?? safeSource),
	};
};

/**
 * Translate one text to a single target locale without storing anything.
 *
 * If translation is unavailable, returns the original text as a safe fallback.
 */
export const translateTextToLocale = async (
	sourceText: string,
	sourceLocale: SupportedLocale = DEFAULT_LOCALE,
	targetLocale: SupportedLocale = DEFAULT_LOCALE,
): Promise<string> => {
	const safeSource = sourceText.trim();

	if (safeSource.length === 0 || sourceLocale === targetLocale) {
		return safeSource;
	}

	const localized = await localizeTextFromSource(safeSource, sourceLocale);
	return localized[targetLocale];
};

/**
 * Localize multiple texts in parallel, using a batch API call when available.
 */
const localizeTextsFromSource = async (
	sourceTexts: string[],
	sourceLocale: SupportedLocale = DEFAULT_LOCALE,
): Promise<Array<Record<SupportedLocale, string>>> => {
	const safeSources = sourceTexts.map((text) => text.trim());

	if (safeSources.length === 0) {
		return [];
	}

	if (safeSources.length === 1) {
		return [await localizeTextFromSource(safeSources[0], sourceLocale)];
	}

	const batchTranslations = await requestBatchedTranslations(
		safeSources,
		sourceLocale,
	);
	if (batchTranslations) {
		return safeSources.map((safeSource, index) => {
			const translations = batchTranslations[index];

			if (!translations) {
				return fallbackLocalizedText(safeSource);
			}

			return {
				en:
					sourceLocale === "en"
						? safeSource
						: (sanitizeTranslation(translations.en) ?? safeSource),
				fi:
					sourceLocale === "fi"
						? safeSource
						: (sanitizeTranslation(translations.fi) ?? safeSource),
				ru:
					sourceLocale === "ru"
						? safeSource
						: (sanitizeTranslation(translations.ru) ?? safeSource),
			};
		});
	}

	return Promise.all(
		safeSources.map((text) => localizeTextFromSource(text, sourceLocale)),
	);
};

/**
 * Localizes instruction steps when the source language is explicitly known.
 *
 * Used for recipe.instructions which is an array of cooking steps
 *
 * Flow:
 * 1. Trim all source-language steps
 * 2. Translate each step individually (parallel)
 * 3. Reorganize by language:
 *    en: [step1_en, step2_en, ...],
 *    fi: [step1_fi, step2_fi, ...],
 *    ru: [step1_ru, step2_ru, ...]
 *
 * Preserves step order and returns language-grouped arrays:
 * `{ en: [...], fi: [...], ru: [...] }`.
 */
export const localizeInstructionStepsFromSource = async (
	steps: string[],
	sourceLocale: SupportedLocale = DEFAULT_LOCALE,
): Promise<Record<SupportedLocale, string[]>> => {
	// Sanitize and trim each step
	const safeSteps = steps.map((step) => step.trim());

	const translatedSteps = await localizeTextsFromSource(
		safeSteps,
		sourceLocale,
	);

	// Reorganize: group by language instead of by step
	return {
		en: translatedSteps.map((item) => item.en),
		fi: translatedSteps.map((item) => item.fi),
		ru: translatedSteps.map((item) => item.ru),
	};
};
