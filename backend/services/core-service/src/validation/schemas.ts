/**
 * Validation Schemas
 *
 * Uses Zod for RUNTIME data validation
 * Runtime = we validate when data arrives from client (not just at compile time)
 *
 * TypeScript types validate during development, but don't help if client sends wrong data
 * Zod validates ACTUAL data during runtime
 */

import { z } from "zod";

/**
 * VALIDATIONS (checking data from client)
 */

/**
 * Integer Range Constant
 * Maximum value for PostgreSQL INTEGER type (2^31 - 1)
 */
const MAX_SIGNED_INT = 2147483647;

/**
 * Positive Integer ID schema
 *
 * Single schema for both recipe IDs and user IDs
 * Logic:
 * - Transforms string input to number (coerce)
 * - Validates it's positive integer ≤ MAX_SIGNED_INT
 * - Returns as NUMBER
 *
 * Works for:
 * - Recipe ID: URL parameter req.params.id → number → getRecipeById(id: number)
 * - User ID: HTTP header X-User-Id → number → getRecipeById(userId?: number)
 */
const intIdSchema = z.coerce.number().int().positive().max(MAX_SIGNED_INT);

const recipeIdSchema = intIdSchema;

export const userIdIntSchema = intIdSchema;

const recipeStatusSchema = z.enum(["draft", "published", "archived"]);

type ValidationResult =
	| { valid: true; value: number }
	| { valid: false; error: string };

export const validateRecipeId = (id: unknown): ValidationResult => {
	const result = recipeIdSchema.safeParse(id);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: `Must be a positive integer in range 1..${MAX_SIGNED_INT}`,
	};
};

export const validateUserId = (id: unknown): ValidationResult => {
	const result = userIdIntSchema.safeParse(id);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: `Must be a positive integer in range 1..${MAX_SIGNED_INT}`,
	};
};

/**
 * TYPES (describes Recipe object structure)
 */

/**
 * Zod schema for Recipe - describes what fields should exist and their types
 *
 * z.object({...}) - object with fields
 * z.string() - string type
 * z.number() - number type
 * z.enum([...]) - can ONLY be one of the values in array
 * .min().max() - minimum and maximum value
 */
export const recipeSchema = z.object({
	id: z.number().int().positive(), // ID must be positive integer
	title: z.string(), // Title - string
	author_id: userIdIntSchema.nullable(), // Author can be null (ON DELETE SET NULL)
	status: recipeStatusSchema, // ONLY these statuses
	description: z.string().nullable(), // Description can be null in DB
	instructions: z.array(z.string()), // Instructions required (NOT NULL)
	servings: z.number().int().positive(), // Servings is required (NOT NULL, default 1)
	spiciness: z.number().int().min(0).max(3), // 0 to 3, NOT NULL DEFAULT 0
	rating_avg: z.coerce.number().min(1).max(5).nullable(), // numeric(3,2) or null
});

/**
 * Zod schema for RecipeListItem - minimal recipe info for list view
 * Used by getAllRecipes() endpoint
 */
export const recipeListItemSchema = z.object({
	id: z.number().int().positive(),
	title: z.string(),
	author_id: userIdIntSchema.nullable(),
	description: z.string().nullable(),
	rating_avg: z.coerce.number().min(1).max(5).nullable(),
});

/**
 * MyRecipeListItem type - minimal recipe info for current user list view
 * Includes status because /users/me/recipes returns recipes of all statuses
 */
export const myRecipeListItemSchema = z.object({
	id: z.number().int().positive(),
	title: z.string(),
	author_id: userIdIntSchema.nullable(), // Maybe delete this field from /users/me/recipes response since it's always the same as current user?
	description: z.string().nullable(),
	rating_avg: z.coerce.number().min(1).max(5).nullable(),
	status: recipeStatusSchema,
});

/**
 * z.infer<typeof recipeSchema> - "extract TypeScript type from Zod schema"
 *
 * This means Recipe type will contain all fields from recipeSchema above
 * If recipeSchema changes - Recipe types automatically update
 * (DRY principle - don't repeat code)
 *
 * Usage: const recipe: Recipe = { id: "...", title: "..." }
 */
export type Recipe = z.infer<typeof recipeSchema>;

/**
 * RecipeListItem type - minimal recipe info for list view
 * Inferred from recipeListItemSchema, automatically stays in sync
 */
export type RecipeListItem = z.infer<typeof recipeListItemSchema>;

/**
 * MyRecipeListItem type - minimal recipe info for current user's recipes
 */
export type MyRecipeListItem = z.infer<typeof myRecipeListItemSchema>;
