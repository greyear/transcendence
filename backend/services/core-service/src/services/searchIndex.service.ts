const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL?.trim();
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.trim();

const rawSearchReindexTimeoutMs = Number(
	process.env.SEARCH_REINDEX_TIMEOUT_MS ?? 5000,
);
const SEARCH_REINDEX_TIMEOUT_MS =
	Number.isFinite(rawSearchReindexTimeoutMs) && rawSearchReindexTimeoutMs > 0
		? rawSearchReindexTimeoutMs
		: 5000;

const searchServiceUrl = (): string | null => {
	if (!SEARCH_SERVICE_URL) {
		return null;
	}

	return SEARCH_SERVICE_URL.replace(/\/+$/, "");
};

const reindexRecipeInSearch = async (recipeId: number): Promise<void> => {
	const baseUrl = searchServiceUrl();
	if (!baseUrl) {
		return;
	}

	if (!INTERNAL_SERVICE_TOKEN) {
		console.error(
			"SEARCH_SERVICE_URL is set but INTERNAL_SERVICE_TOKEN is missing; skipping search reindex",
		);
		return;
	}

	const response = await fetch(`${baseUrl}/admin/reindex/${recipeId}`, {
		method: "POST",
		headers: {
			"X-Internal-Service-Token": INTERNAL_SERVICE_TOKEN,
		},
		signal: AbortSignal.timeout(SEARCH_REINDEX_TIMEOUT_MS),
	});

	if (!response.ok) {
		const responseBody = await response.text().catch(() => "");
		throw new Error(
			`Search reindex failed with status ${response.status}: ${responseBody}`,
		);
	}
};

export const scheduleRecipeSearchReindex = (recipeId: number): void => {
	void reindexRecipeInSearch(recipeId).catch((error) => {
		console.error(`Search reindex failed for recipe ${recipeId}:`, error);
	});
};
