/**
 * Translation Service
 *
 * Handles automatic localization of recipe content (title, description, instructions)
 * from English to Finnish and Russian.
 *
 * When a recipe is created/updated:
 * 1. User provides English text
 * 2. This service translates it to fi/ru (if external AI service is available)
 * 3. All 3 language versions are stored in JSONB: { en, fi, ru }
 * 4. When fetching, user gets the language they requested
 *
 * If translation service is unavailable → fallback to English for all languages
 */

import {
	DEFAULT_LOCALE,
	type SupportedLocale,
} from "../validation/schemas.js";

// Supported languages for recipe content
const SUPPORTED_TRANSLATION_LOCALES: SupportedLocale[] = ["en", "fi", "ru"];

// Configuration from environment (optional)
// Example: TRANSLATION_API_URL=http://localhost:3003/translate
// If not set, fallback will be used (English text for all languages)
const TRANSLATION_API_URL = process.env.TRANSLATION_API_URL;
const TRANSLATION_TIMEOUT_MS = Number(process.env.TRANSLATION_TIMEOUT_MS ?? 8000);

type TranslationApiResponse = {
	translations?: Partial<Record<SupportedLocale, string>>;
};

/**
 * Creates an AbortSignal for fetch timeout
 * Ensures translation requests don't hang indefinitely
 */
const timeoutSignal = (): AbortSignal => {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);
	return controller.signal;
};

/**
 * Fallback: returns the same English text for all languages
 * Used when translation service is unavailable or times out
 */
const fallbackLocalizedText = (source: string): Record<SupportedLocale, string> => ({
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
 * Contacts external translation service
 * Expected to be a microservice compatible with this contract:
 *
 * POST TRANSLATION_API_URL
 * Request body: {
 *   source_language: "en",
 *   target_languages: ["fi", "ru"],
 *   text: "English text to translate"
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
			},
			body: JSON.stringify({
				source_language: DEFAULT_LOCALE,
				target_languages: SUPPORTED_TRANSLATION_LOCALES.filter(
					(locale) => locale !== DEFAULT_LOCALE,
				),
				text: sourceText,
			}),
			signal: timeoutSignal(),
		});

		if (!response.ok) {
			console.warn("Translation API request failed with status", response.status);
			return null;
		}

		const data = (await response.json()) as TranslationApiResponse;
		if (!data.translations || typeof data.translations !== "object") {
			return null;
		}

		return data.translations;
	} catch (error) {
		console.warn("Translation API is unavailable, fallback will be used:", error);
		return null;
	}
};

/**
 * Localize a single text field (e.g., recipe title or description)
 *
 * Flow:
 * 1. Trim and clean English text
 * 2. Try to get translations from external service
 * 3. If no service or error → use fallback (English for all)
 * 4. If translations partial → fill gaps with English
 *
 * Returns: { en: "...", fi: "...", ru: "..." }
 */
export const localizeTextFromEnglish = async (
	sourceText: string,
): Promise<Record<SupportedLocale, string>> => {
	const safeSource = sourceText.trim();
	const fallback = fallbackLocalizedText(safeSource);
	const translations = await requestTranslations(safeSource);

	// If no external translations available, return fallback
	if (!translations) {
		return fallback;
	}

	// Merge: prioritize translations, fill gaps with English
	return {
		en: safeSource,
		fi: sanitizeTranslation(translations.fi) ?? safeSource,
		ru: sanitizeTranslation(translations.ru) ?? safeSource,
	};
};

/**
 * Localize an array of instruction steps
 *
 * Used for recipe.instructions which is an array of cooking steps
 *
 * Flow:
 * 1. Trim all English steps
 * 2. Translate each step individually (parallel)
 * 3. Reorganize by language:
 *    en: [step1_en, step2_en, ...],
 *    fi: [step1_fi, step2_fi, ...],
 *    ru: [step1_ru, step2_ru, ...]
 *
 * Returns: { en: [...], fi: [...], ru: [...] }
 */
export const localizeInstructionStepsFromEnglish = async (
	steps: string[],
): Promise<Record<SupportedLocale, string[]>> => {
	// Sanitize and trim each step
	const enSteps = steps.map((step) => step.trim());

	// Translate each step in parallel (not sequential)
	const translatedSteps = await Promise.all(
		enSteps.map((step) => localizeTextFromEnglish(step)),
	);

	// Reorganize: group by language instead of by step
	return {
		en: translatedSteps.map((item) => item.en),
		fi: translatedSteps.map((item) => item.fi),
		ru: translatedSteps.map((item) => item.ru),
	};
};
