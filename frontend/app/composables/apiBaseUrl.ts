// Read the API base URL from Vite env, falling back to the same-origin /api path
// served by Traefik so the browser only has to trust one cert (the frontend's).
export const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? "https://localhost:5173/api";
