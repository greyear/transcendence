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

export const recipeStatusSchema = z.enum([
	"draft",
	"moderation",
	"published",
	"archived",
]);

const recipeIngredientSchema = z.object({
	ingredient_id: intIdSchema,
	name: z.string().trim().min(1).max(128),
	amount: z.coerce.number().positive(),
	unit: z.string().min(1).max(16),
});

const recipeCategorySchema = z.object({
	id: intIdSchema,
	code: z.string().trim().min(1).max(32),
	category_type_id: intIdSchema,
	category_type_code: z.string().trim().min(1).max(32),
	category_type_name: z.string().trim().min(1).max(64),
});

// TODO: add endpoint for autocomplete ingredients - returns list of { ingredient_id, name } matching search query
const createRecipeIngredientInputSchema = z.object({
	ingredient_id: intIdSchema,
	amount: z.coerce.number().positive(),
	unit: z.string().trim().min(1).max(16),
});

const createRecipeCategoryIdSchema = intIdSchema;

const createRecipeInputSchema = z.object({
	title: z.string().trim().min(1).max(256),
	description: z.string().max(5000).optional().nullable(),
	instructions: z.array(z.string().trim().min(1)).min(1),
	servings: intIdSchema.optional().default(1),
	spiciness: z.coerce.number().int().min(0).max(3).optional().default(0),
	ingredients: z
		.array(createRecipeIngredientInputSchema)
		.min(1)
		.refine(
			(items) =>
				new Set(items.map((item) => item.ingredient_id)).size === items.length,
			"ingredient_id values must be unique",
		),
	category_ids: z
		.array(createRecipeCategoryIdSchema)
		.default([])
		.refine(
			(items) => new Set(items).size === items.length,
			"category_ids must be unique",
		),
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

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

type CreateRecipeValidationResult =
	| { valid: true; value: CreateRecipeInput }
	| { valid: false; error: string };

export const validateCreateRecipeInput = (
	input: unknown,
): CreateRecipeValidationResult => {
	const result = createRecipeInputSchema.safeParse(input);

	if (result.success) {
		const description =
			typeof result.data.description === "string"
				? result.data.description.trim()
				: result.data.description;

		return {
			valid: true,
			value: {
				...result.data,
				description: description && description.length > 0 ? description : null,
			},
		};
	}

	return {
		valid: false,
		error: z.prettifyError(result.error),
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
	ingredients: z.array(recipeIngredientSchema),
	categories: z.array(recipeCategorySchema),
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
