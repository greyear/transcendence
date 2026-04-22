import { z } from "zod";

export const AuthErrorResponseSchema = z.object({
	error: z.string().optional(),
});

export const readAuthError = async (response: Response) => {
	const body: unknown = await response.json().catch(() => null);
	const parsed = AuthErrorResponseSchema.safeParse(body);

	return parsed.success ? parsed.data.error : undefined;
};
