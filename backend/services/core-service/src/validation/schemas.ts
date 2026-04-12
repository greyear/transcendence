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
const MAX_REVIEW_BODY_LENGTH = 1000;

/**
 * Positive Integer schema
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
const positiveIntSchema = z.coerce
	.number()
	.int()
	.positive()
	.max(MAX_SIGNED_INT);

export const userIdSchema = positiveIntSchema;

export const supportedLocaleSchema = z.enum(["en", "fi", "ru"]);
export type SupportedLocale = z.infer<typeof supportedLocaleSchema>;
export const DEFAULT_LOCALE: SupportedLocale = "en";

const userPresenceStatusSchema = z.enum(["online", "offline"]);

export const recipeStatusSchema = z.enum([
	"draft",
	"moderation",
	"published",
	"archived",
]);

const recipeIngredientSchema = z.object({
	ingredient_id: positiveIntSchema,
	name: z.string().trim().min(1).max(128),
	amount: z.coerce.number().positive(),
	unit: z.string().min(1).max(16),
});

const recipeCategorySchema = z.object({
	id: positiveIntSchema,
	code: z.string().trim().min(1).max(32),
	category_type_id: positiveIntSchema,
	category_type_code: z.string().trim().min(1).max(32),
	category_type_name: z.string().trim().min(1).max(64),
});

// TODO: add endpoint for autocomplete ingredients - returns list of { ingredient_id, name } matching search query
const createRecipeIngredientInputSchema = z.object({
	ingredient_id: positiveIntSchema,
	amount: z.coerce.number().positive(),
	unit: z.string().trim().min(1).max(16),
});

const createRecipeCategoryIdSchema = positiveIntSchema;

const createRecipeInputSchema = z.object({
	title: z.string().trim().min(1).max(256),
	description: z.string().trim().max(5000).nullable(),
	instructions: z.array(z.string().trim().min(1)).min(1),
	servings: positiveIntSchema,
	spiciness: z.coerce.number().int().min(0).max(3),
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

const ratingInputSchema = z.object({
	rating: z.coerce.number().int().min(1).max(5),
});

const updateRecipeInputSchema = createRecipeInputSchema;

const createRecipeReviewInputSchema = z.object({
	body: z.string().trim().min(1).max(MAX_REVIEW_BODY_LENGTH),
});

const updateRecipeReviewInputSchema = z.object({
	body: z.string().trim().min(1).max(MAX_REVIEW_BODY_LENGTH),
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;
export type CreateRecipeReviewInput = z.infer<
	typeof createRecipeReviewInputSchema
>;
export type UpdateRecipeReviewInput = z.infer<
	typeof updateRecipeReviewInputSchema
>;

type ValidationResult<T> =
	| { valid: true; value: T }
	| { valid: false; error: string };

const validateIntId = (id: unknown): ValidationResult<number> => {
	const result = positiveIntSchema.safeParse(id);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: `Must be a positive integer in range 1..${MAX_SIGNED_INT}`,
	};
};

export const validateRecipeId = validateIntId;

export const validateUserId = validateIntId;

export const validateLocale = (
	input: unknown,
): ValidationResult<SupportedLocale> => {
	const result = supportedLocaleSchema.safeParse(input);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: "Supported locales are: en, fi, ru",
	};
};

export const validateCreateRecipeInput = (
	input: unknown,
): ValidationResult<CreateRecipeInput> => {
	const result = createRecipeInputSchema.safeParse(input);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: z.prettifyError(result.error),
	};
};

export const validateUpdateRecipeInput = (
	input: unknown,
): ValidationResult<UpdateRecipeInput> => {
	const result = updateRecipeInputSchema.safeParse(input);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: z.prettifyError(result.error),
	};
};

export const validateRatingInput = (
	input: unknown,
): ValidationResult<RatingInput> => {
	const result = ratingInputSchema.safeParse(input);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: z.prettifyError(result.error),
	};
};

export const validateCreateRecipeReviewInput = (
	input: unknown,
): ValidationResult<CreateRecipeReviewInput> => {
	const result = createRecipeReviewInputSchema.safeParse(input);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: z.prettifyError(result.error),
	};
};

export const validateUpdateRecipeReviewInput = (
	input: unknown,
): ValidationResult<UpdateRecipeReviewInput> => {
	const result = updateRecipeReviewInputSchema.safeParse(input);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: z.prettifyError(result.error),
	};
};

/**
 * TYPES (describes Recipe object structure)
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
	author_id: userIdSchema.nullable(), // Author can be null (ON DELETE SET NULL)
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
	author_id: userIdSchema.nullable(),
	description: z.string().nullable(),
	rating_avg: z.coerce.number().min(1).max(5).nullable(),
});

/**
 * Zod schema for FavoriteRecipeListItem - list view for current user's favorites
 * Includes author avatar and omits rating_avg
 */
export const favoriteRecipeListItemSchema = z.object({
	id: z.number().int().positive(),
	title: z.string(),
	description: z.string().nullable(),
	avatar: z.string().nullable(),
});

/**
 * MyRecipeListItem type - minimal recipe info for current user list view
 * Includes status because /users/me/recipes returns recipes of all statuses
 */
export const myRecipeListItemSchema = z.object({
	id: z.number().int().positive(),
	title: z.string(),
	author_id: userIdSchema.nullable(), // Maybe delete this field from /users/me/recipes response since it's always the same as current user?
	description: z.string().nullable(),
	rating_avg: z.coerce.number().min(1).max(5).nullable(),
	status: recipeStatusSchema,
});

export const recipeReviewListItemSchema = z.object({
	id: z.number().int().positive(),
	recipe_id: z.number().int().positive(),
	author_id: userIdSchema.nullable(),
	username: z.string().trim().min(1).max(32).nullable(),
	avatar: z.string().nullable(),
	body: z.string(),
	created_at: z.coerce.date().transform((value) => value.toISOString()),
	updated_at: z.coerce.date().transform((value) => value.toISOString()),
});

/**
 * Zod schema for UserListItem - lightweight user data for list pages/cards
 * Used by getAllUsers() endpoint
 */
export const userListItemSchema = z.object({
	id: z.number().int().positive(),
	username: z.string().trim().min(1).max(32),
	avatar: z.string().nullable(),
	recipes_count: z.coerce.number().int().min(0),
});

/**
 * Zod schema for UserProfile - detailed user data for profile page
 *
 * Note:
 * - Recipes are intentionally excluded from this schema
 * - Recipes are fetched via GET /users/:id/recipes
 * - This keeps profile payload stable and enables independent pagination/filtering later
 */
export const userProfileSchema = z.object({
	id: z.number().int().positive(),
	username: z.string().trim().min(1).max(32),
	avatar: z.string().nullable(),
	status: userPresenceStatusSchema.nullable(),
	recipes_count: z.coerce.number().int().min(0),
});

/**
 * ProfileData schema - slim profile shape returned by GET/PUT /profile
 * Only the fields the user can see and edit about themselves.
 */
export const profileDataSchema = z.object({
	id: z.number().int().positive(),
	username: z.string().trim().min(1).max(32),
	avatar: z.string().nullable(),
});

export type ProfileData = z.infer<typeof profileDataSchema>;

/**
 * UpdateProfileInput schema - body for PUT /profile
 *
 * Both fields are optional so the user can update just one at a time.
 * avatar is a string here because multer resolves the file and the route
 * injects the public URL path before validation runs.
 * At least one field must be present.
 */
const updateProfileInputSchema = z
	.object({
		username: z.string().trim().min(1).max(32).optional(),
		avatar: z.string().nullable().optional(),
	})
	.refine(
		(data) => data.username !== undefined || data.avatar !== undefined,
		"At least one field (username or avatar) must be provided",
	);

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const validateUpdateProfileInput = (
	input: unknown,
): ValidationResult<UpdateProfileInput> => {
	const result = updateProfileInputSchema.safeParse(input);

	if (result.success) {
		return { valid: true, value: result.data };
	}

	return {
		valid: false,
		error: z.prettifyError(result.error),
	};
};

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
 * FavoriteRecipeListItem type - list view for current user's favorites
 */
export type FavoriteRecipeListItem = z.infer<
	typeof favoriteRecipeListItemSchema
>;

/**
 * MyRecipeListItem type - minimal recipe info for current user's recipes
 */
export type MyRecipeListItem = z.infer<typeof myRecipeListItemSchema>;
export type RecipeReviewListItem = z.infer<typeof recipeReviewListItemSchema>;
export type UserListItem = z.infer<typeof userListItemSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

export type RatingInput = z.infer<typeof ratingInputSchema>;