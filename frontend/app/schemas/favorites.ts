import { z } from "zod";

export const FavoriteRecipeSchema = z.object({
	id: z.number().int().positive(),
	title: z.string(),
	description: z.string().nullable(),
	picture_url: z.string().nullable(),
});

export const FavoriteRecipesResponseSchema = z.object({
	data: z.array(FavoriteRecipeSchema),
	count: z.number(),
});

export type FavoriteRecipe = z.infer<typeof FavoriteRecipeSchema>;
