import { API_BASE_URL } from "~/composables/apiBaseUrl";

export const resolveMediaUrl = (url?: string | null): string | null => {
	if (!url) {
		return null;
	}

	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}

	if (url.startsWith("/")) {
		return `${API_BASE_URL}${url}`;
	}

	return `${API_BASE_URL}/${url}`;
};
