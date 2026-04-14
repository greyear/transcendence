// Read the API base URL from Vite env, falling back to localhost for local development.
export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? "https://localhost";