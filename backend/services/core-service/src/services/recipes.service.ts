/**
 * Recipes Service (Business Logic Layer)
 *
 * Contains business logic for working with recipes:
 * - Database queries
 * - Access control checks (guests see only published recipes)
 * - Returning data in correct format
 *
 * TypeScript benefits:
 * - Recipe and RecipeListItem types from schemas.ts (inferred from Zod)
 * - Async/await with typing guarantees function returns Promise
 * - Function parameters are type-safe (id: number, userId?: number)
 * - Query params always contain only numbers (no undefined values sent to DB)
 */

import fs from "node:fs";
import path from "node:path";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pool } from "../db/database.js";
import { areMutualFollowers } from "../utils/service.utils.js";
import {
	type CreateRecipeInput,
	type CreateRecipeReviewInput,
	DEFAULT_LOCALE,
	type FavoriteRecipeListItem,
	favoriteRecipeListItemSchema,
	type MyRecipeListItem,
	myRecipeListItemSchema,
	type PaginatedResponse,
	type Recipe,
	type RecipeListItem,
	type RecipeReviewListItem,
	recipeListItemSchema,
	recipeReviewListItemSchema,
	recipeSchema,
	recipeStatusSchema,
	type SearchRecipeDocument,
	type SupportedLocale,
	searchRecipeDocumentSchema,
	type UpdateRecipeInput,
	type UpdateRecipeReviewInput,
} from "../validation/schemas.js";
import { scheduleRecipeSearchReindex } from "./searchIndex.service.js";
import {
	localizeInstructionStepsFromSource,
	localizeTextFromSource,
} from "./translation.service.js";

type PublishRecipeResult =
	| { success: true; recipe: Recipe }
	| {
			success: false;
			reason: "not-found" | "forbidden" | "invalid-status";
			currentStatus?: string;
	  };

type UpdateRecipeResult =
	| { success: true; recipe: Recipe }
	| {
			success: false;
			reason: "not-found" | "forbidden" | "invalid-status" | "invalid-data";
			currentStatus?: string;
	  };

type ArchiveRecipeResult =
	| { success: true; recipe: Recipe }
	| {
			success: false;
			reason: "not-found" | "forbidden" | "invalid-status";
			currentStatus?: string;
	  };

type FailedRecipeMutationResult = {
	success: false;
	reason: "not-found" | "forbidden" | "invalid-status";
	currentStatus?: string;
};

type UpdateRecipePictureResult =
	| { success: true }
	| {
			success: false;
			reason: "not-found" | "forbidden" | "invalid-status";
			currentStatus?: string;
	  };

type AddFavoriteResult =
	| { success: true; recipeId: number }
	| { success: false; reason: "not-found" | "already-favorited" };

type RemoveFavoriteResult =
	| { success: true; recipeId: number }
	| { success: false; reason: "not-found" | "not-favorited" };

type LeaveRecipeReviewResult =
	| { success: true; reviewId: number }
	| { success: false; reason: "not-found" | "unauthorized" };

type UpdateReviewResult =
	| { success: true; review: RecipeReviewListItem }
	| { success: false; reason: "not-found" | "forbidden" };

type DeleteReviewResult =
	| { success: true; reviewId: number; recipeId: number; updatedAt: string }
	| { success: false; reason: "not-found" | "forbidden" };

interface ErrorWithCode extends Error {
	code?: string;
}

const USER_NOT_FOUND_CODE = "USER_NOT_FOUND";

const recipeIdRowSchema = z.object({
	id: z.coerce.number().int().positive(),
});

const recipeVisibilityRowSchema = z.object({
	author_id: z.coerce.number().int().positive().nullable(),
	status: recipeStatusSchema,
});

const requesterRoleRowSchema = z.object({
	role: z.enum(["guest", "user", "admin"]),
});

// PostgreSQL SQLSTATE for foreign_key_violation.
const PG_FOREIGN_KEY_VIOLATION = "23503";

const rowIdSchema = z
	.object({ id: z.union([z.number(), z.string()]) })
	.transform((r) => r.id)
	.catch("unknown");

const getRecipeWithIngredientsQuery = `
	SELECT
		r.id,
		COALESCE(r.title->>$2, r.title->>'en') AS title,
		COALESCE(r.description->>$2, r.description->>'en') AS description,
		COALESCE(r.instructions->$2, r.instructions->'en', '[]'::jsonb) AS instructions,
		r.servings,
		r.spiciness,
		r.author_id,
		r.rating_avg,
		(
			SELECT rm.url
			FROM recipe_media rm
			WHERE rm.recipe_id = r.id AND rm.position = 0
			LIMIT 1
		) AS picture_url,
		r.status,
		COALESCE(
			(
				SELECT json_agg(
					json_build_object(
						'ingredient_id', ri.ingredient_id,
						'name', i.name,
						'amount', ri.amount,
						'unit', ri.unit
					)
					ORDER BY ri.ingredient_id
				)
				FROM recipe_ingredients ri
				JOIN ingredients i ON i.id = ri.ingredient_id
				WHERE ri.recipe_id = r.id
			),
			'[]'::json
		) AS ingredients,
		COALESCE(
			(
				SELECT json_agg(
					json_build_object(
						'id', rc.id,
						'code', rc.code,
						'category_type_id', rct.id,
						'category_type_code', rct.code,
						'category_type_name', rct.name
					)
					ORDER BY rct.id, rc.id
				)
				FROM recipe_category_map rcm
				JOIN recipe_categories rc ON rc.id = rcm.category_id
				JOIN recipe_category_types rct ON rct.id = rc.category_type_id
				WHERE rcm.recipe_id = r.id
			),
			'[]'::json
		) AS categories
	FROM recipes r
	WHERE r.id = $1
`;

const parseRecipeRows = <T>(
	rows: unknown[],
	schema: z.ZodType<T>,
	rowLabel: string,
): T[] => {
	return rows.reduce<T[]>((acc, row) => {
		const validation = schema.safeParse(row);
		if (validation.success) {
			acc.push(validation.data);
		} else {
			const rowId = rowIdSchema.parse(row);

			console.error(
				`Skipping invalid ${rowLabel} ID ${rowId}:`,
				z.prettifyError(validation.error),
			);
		}
		return acc;
	}, []);
};

const parseRecipeRow = (row: unknown, rowLabel: string): Recipe | null => {
	const validation = recipeSchema.safeParse(row);
	if (!validation.success) {
		console.error(
			`Invalid recipe data for ${rowLabel}:`,
			z.prettifyError(validation.error),
		);
		return null;
	}

	return validation.data;
};

const getRecipeWithIngredientsById = async (
	recipeId: number,
	locale: SupportedLocale,
	client?: PoolClient,
): Promise<Recipe | null> => {
	const db = client ?? pool;
	const result = await db.query(getRecipeWithIngredientsQuery, [
		recipeId,
		locale,
	]);

	if (result.rows.length === 0) {
		return null;
	}

	return parseRecipeRow(result.rows[0], `ID ${recipeId}`);
};

const duplicateTextAcrossLocales = (
	sourceText: string,
): Record<SupportedLocale, string> => {
	const safeSource = sourceText.trim();

	return {
		en: safeSource,
		fi: safeSource,
		ru: safeSource,
	};
};

const duplicateInstructionsAcrossLocales = (
	steps: string[],
): Record<SupportedLocale, string[]> => {
	const safeSteps = steps.map((step) => step.trim());

	return {
		en: safeSteps,
		fi: safeSteps,
		ru: safeSteps,
	};
};

const scheduleRecipeLocalization = (
	recipeId: number,
	updatedAt: unknown,
	sourceLocale: SupportedLocale,
	input: Pick<CreateRecipeInput, "title" | "description" | "instructions">,
): void => {
	void (async () => {
		try {
			const [localizedTitle, localizedDescription, localizedInstructions] =
				await Promise.all([
					localizeTextFromSource(input.title, sourceLocale),
					input.description === null
						? Promise.resolve(null)
						: localizeTextFromSource(input.description, sourceLocale),
					localizeInstructionStepsFromSource(input.instructions, sourceLocale),
				]);

			const result = await pool.query(
				`
				UPDATE recipes
				SET title = $1, description = $2, instructions = $3, updated_at = now()
				WHERE id = $4 AND updated_at = $5
			`,
				[
					localizedTitle,
					localizedDescription,
					localizedInstructions,
					recipeId,
					updatedAt,
				],
			);

			if (result.rowCount === 0) {
				return;
			}
		} catch (error) {
			console.error(
				`Background localization failed for recipe ${recipeId}:`,
				error,
			);
		}
	})();
};

const userExists = async (userId: number): Promise<boolean> => {
	const result = await pool.query(`SELECT 1 FROM users WHERE id = $1 LIMIT 1`, [
		userId,
	]);

	return result.rowCount === 1;
};

const classifyNoRowsRecipeMutation = async (
	recipeId: number,
	requesterId: number,
	options?: {
		isAdmin?: boolean;
		priorityInvalidStatuses?: readonly string[];
	},
): Promise<FailedRecipeMutationResult> => {
	const existingResult = await pool.query(
		`SELECT author_id, status FROM recipes WHERE id = $1`,
		[recipeId],
	);

	// Case 1: recipe does not exist at all.
	if (existingResult.rowCount === 0) {
		return { success: false, reason: "not-found" };
	}

	// Validate DB row shape before reading fields.
	const existingRecipeParsed = recipeVisibilityRowSchema.safeParse(
		existingResult.rows[0],
	);
	// Unexpected row structure is treated as internal error.
	if (!existingRecipeParsed.success) {
		throw new Error(z.prettifyError(existingRecipeParsed.error));
	}

	const { author_id, status } = existingRecipeParsed.data;

	// Case 2: some statuses should return invalid-status before permission checks.
	if (options?.priorityInvalidStatuses?.includes(status)) {
		return {
			success: false,
			reason: "invalid-status",
			currentStatus: status,
		};
	}

	const isAdmin = options?.isAdmin === true;
	// Case 3: recipe exists, but requester is neither owner nor admin.
	if (author_id !== requesterId && !isAdmin) {
		return { success: false, reason: "forbidden" };
	}

	// Case 4: requester is allowed, but current status blocks this mutation.
	return {
		success: false,
		reason: "invalid-status",
		currentStatus: status,
	};
};

const isForeignKeyViolation = (error: unknown): boolean => {
	if (!error || typeof error !== "object") {
		return false;
	}

	// This means a referenced row does not exist (e.g. unknown ingredient/category id).
	return "code" in error && error.code === PG_FOREIGN_KEY_VIOLATION;
};

const UNIQUE_VIOLATION = "23505";
const isUniqueViolation = (error: unknown): boolean => {
	if (!error || typeof error !== "object") {
		return false;
	}

	return "code" in error && error.code === UNIQUE_VIOLATION;
};

const publishedRecipeExists = async (recipeId: number): Promise<boolean> => {
	const result = await pool.query(
		`SELECT 1 FROM recipes WHERE id = $1 AND status = 'published' LIMIT 1`,
		[recipeId],
	);

	return result.rowCount === 1;
};

/**
 * Get ALL published recipes
 *
 * async - function is asynchronous (executes over time, not immediately)
 * Promise<RecipeListItem[]> - returns minimal recipe info (not full Recipe)
 *
 * async/await works like:
 * 1. await pool.query() - wait for database response
 * 2. Return result or throw error
 * 3. Calling code can await getAllRecipes() to wait for result
 */
export const getAllRecipes = async (
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<RecipeListItem[]> => {
	try {
		// SQL query - get only published recipes (status = 'published')
		// ORDER BY created_at DESC - newest first
		const query = `
			SELECT
				id,
				COALESCE(title->>$1, title->>'en') AS title,
				COALESCE(description->>$1, description->>'en') AS description,
				author_id,
				rating_avg,
				(
					SELECT rm.url
					FROM recipe_media rm
					WHERE rm.recipe_id = recipes.id AND rm.position = 0
					LIMIT 1
				) AS picture_url
      FROM recipes
      WHERE status = 'published'
      ORDER BY created_at DESC
    `;

		// pool.query(query) - execute SQL
		// result.rows - array of rows from result
		const result = await pool.query(query, [locale]);

		return parseRecipeRows(result.rows, recipeListItemSchema, "recipe");
	} catch (error) {
		// If error - log it and throw it to caller
		console.error("Database error in getAllRecipes:", error);
		throw error;
	}
};

/**
 * Get published recipes for exact page
 */
export const getAllRecipesPaginated = async (
	page: number,
	perPage: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<PaginatedResponse<RecipeListItem>> => {
	try {
		const offset = (page - 1) * perPage;

		const [dataResult, countResult] = await Promise.all([
			pool.query(
				`
				SELECT
					id,
					COALESCE(title->>$1, title->>'en') AS title,
					COALESCE(description->>$1, description->>'en') AS description,
					author_id,
					rating_avg,
					(
						SELECT rm.url
						FROM recipe_media rm
						WHERE rm.recipe_id = recipes.id AND rm.position = 0
						LIMIT 1
					) AS picture_url
				FROM recipes
				WHERE status = 'published'
				ORDER BY created_at DESC
				LIMIT $2 OFFSET $3
				`,
				[locale, perPage, offset],
			),
			pool.query(
				`SELECT COUNT(*)::int AS total FROM recipes WHERE status = 'published'`,
			),
		]);

		const total_count = countResult.rows[0].total as number;
		const total_pages = Math.ceil(total_count / perPage);
		const data = parseRecipeRows(
			dataResult.rows,
			recipeListItemSchema,
			"recipe",
		);

		return { data, total_count, total_pages, page, per_page: perPage };
	} catch (error) {
		console.error("Database error in getAllRecipesPaginated:", error);
		throw error;
	}
};

/**
 * Get all published recipes created by a particular user
 *
 * Returns:
 * - RecipeListItem[] if user exists (can be empty)
 * - null if user doesn't exist
 */
export const getPublishedRecipesByUserId = async (
	userId: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<RecipeListItem[] | null> => {
	try {
		const exists = await userExists(userId);
		if (!exists) {
			return null;
		}

		const query = `
			SELECT
				id,
				COALESCE(title->>$2, title->>'en') AS title,
				COALESCE(description->>$2, description->>'en') AS description,
				author_id,
				rating_avg,
				(
					SELECT rm.url
					FROM recipe_media rm
					WHERE rm.recipe_id = recipes.id AND rm.position = 0
					LIMIT 1
				) AS picture_url
      FROM recipes
      WHERE author_id = $1 AND status = 'published'
      ORDER BY created_at DESC
    `;

		const result = await pool.query(query, [userId, locale]);

		return parseRecipeRows(
			result.rows,
			recipeListItemSchema,
			"published user recipe",
		);
	} catch (error) {
		console.error("Database error in getPublishedRecipesByUserId:", error);
		throw error;
	}
};

/**
 * Get all recipes created by the current authenticated user
 *
 * Returns recipes of all statuses (draft, moderation, published, archived)
 */
export const getMyRecipes = async (
	userId: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<MyRecipeListItem[]> => {
	try {
		const query = `
			SELECT
				id,
				COALESCE(title->>$2, title->>'en') AS title,
				COALESCE(description->>$2, description->>'en') AS description,
				author_id,
				rating_avg,
				status
      FROM recipes
      WHERE author_id = $1
      ORDER BY created_at DESC
    `;

		const result = await pool.query(query, [userId, locale]);

		return parseRecipeRows(result.rows, myRecipeListItemSchema, "my recipe");
	} catch (error) {
		console.error("Database error in getMyRecipes:", error);
		throw error;
	}
};

export const createRecipe = async (
	userId: number,
	input: CreateRecipeInput,
	locale: SupportedLocale = DEFAULT_LOCALE,
	sourceLocale: SupportedLocale = locale,
): Promise<Recipe> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const placeholderTitle = duplicateTextAcrossLocales(input.title);
		const placeholderDescription =
			input.description === null
				? null
				: duplicateTextAcrossLocales(input.description);
		const placeholderInstructions = duplicateInstructionsAcrossLocales(
			input.instructions,
		);

		const result = await client.query(
			`
      INSERT INTO recipes (title, description, instructions, servings, spiciness, author_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING id, updated_at
    `,
			[
				placeholderTitle,
				placeholderDescription,
				placeholderInstructions,
				input.servings,
				input.spiciness,
				userId,
			],
		);

		const recipeIdParsed = recipeIdRowSchema.safeParse(result.rows[0]);
		if (!recipeIdParsed.success) {
			throw new Error(z.prettifyError(recipeIdParsed.error));
		}

		const recipeId = recipeIdParsed.data.id;

		const ingredientIds: number[] = [];
		const amounts: number[] = [];
		const units: string[] = [];

		for (const { ingredient_id, amount, unit } of input.ingredients) {
			ingredientIds.push(ingredient_id);
			amounts.push(amount);
			units.push(unit);
		}

		await client.query(
			`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
          SELECT $1, unnest($2::int[]), unnest($3::numeric[]), unnest($4::text[])
        `,
			[recipeId, ingredientIds, amounts, units],
		);

		if (input.category_ids.length > 0) {
			await client.query(
				`
          INSERT INTO recipe_category_map (recipe_id, category_id)
          SELECT $1, unnest($2::int[])
        `,
				[recipeId, input.category_ids],
			);
		}

		const recipe = await getRecipeWithIngredientsById(recipeId, locale, client);
		if (!recipe) {
			throw new Error(`Created recipe ${recipeId} could not be loaded`);
		}

		await client.query("COMMIT");
		scheduleRecipeLocalization(
			recipeId,
			result.rows[0].updated_at,
			sourceLocale,
			input,
		);
		return recipe;
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Database error in createRecipe:", error);
		throw error;
	} finally {
		client.release();
	}
};

export const publishRecipe = async (
	recipeId: number,
	userId: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<PublishRecipeResult> => {
	try {
		const updateResult = await pool.query(
			`
      UPDATE recipes
      SET status = 'published', updated_at = now()
      WHERE id = $1 AND author_id = $2 AND status = 'draft'
      RETURNING id
    `,
			[recipeId, userId],
		);

		if (updateResult.rowCount === 0) {
			return classifyNoRowsRecipeMutation(recipeId, userId);
		}

		const recipe = await getRecipeWithIngredientsById(recipeId, locale);
		if (!recipe) {
			throw new Error(`Updated recipe ${recipeId} could not be loaded`);
		}

		scheduleRecipeSearchReindex(recipeId);

		return { success: true, recipe };
	} catch (error) {
		console.error("Database error in publishRecipe:", error);
		throw error;
	}
};

export const updateRecipe = async (
	recipeId: number,
	userId: number,
	input: UpdateRecipeInput,
	locale: SupportedLocale = DEFAULT_LOCALE,
	sourceLocale: SupportedLocale = locale,
): Promise<UpdateRecipeResult> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const placeholderTitle = duplicateTextAcrossLocales(input.title);
		const placeholderDescription =
			input.description === null
				? null
				: duplicateTextAcrossLocales(input.description);
		const placeholderInstructions = duplicateInstructionsAcrossLocales(
			input.instructions,
		);

		const updateResult = await client.query(
			`
      UPDATE recipes
      SET
        title = $1,
        description = $2,
        instructions = $3,
        servings = $4,
        spiciness = $5,
        updated_at = now()
      WHERE id = $6 AND author_id = $7 AND status = 'draft'
      RETURNING id, updated_at
    `,
			[
				placeholderTitle,
				placeholderDescription,
				placeholderInstructions,
				input.servings,
				input.spiciness,
				recipeId,
				userId,
			],
		);

		if (updateResult.rowCount === 0) {
			// Nothing updated: classify missing recipe vs forbidden vs invalid status.
			await client.query("ROLLBACK");

			return classifyNoRowsRecipeMutation(recipeId, userId);
		}

		const ingredientIds: number[] = [];
		const amounts: number[] = [];
		const units: string[] = [];

		for (const { ingredient_id, amount, unit } of input.ingredients) {
			ingredientIds.push(ingredient_id);
			amounts.push(amount);
			units.push(unit);
		}

		// Replace links atomically: clear old ingredient/category relations and insert new ones.
		await client.query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [
			recipeId,
		]);
		await client.query(`DELETE FROM recipe_category_map WHERE recipe_id = $1`, [
			recipeId,
		]);

		await client.query(
			`
        INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
        SELECT $1, unnest($2::int[]), unnest($3::numeric[]), unnest($4::text[])
      `,
			[recipeId, ingredientIds, amounts, units],
		);

		if (input.category_ids.length > 0) {
			await client.query(
				`
          INSERT INTO recipe_category_map (recipe_id, category_id)
          SELECT $1, unnest($2::int[])
        `,
				[recipeId, input.category_ids],
			);
		}

		const recipe = await getRecipeWithIngredientsById(recipeId, locale, client);
		if (!recipe) {
			throw new Error(`Updated recipe ${recipeId} could not be loaded`);
		}

		await client.query("COMMIT");
		scheduleRecipeLocalization(
			recipeId,
			updateResult.rows[0].updated_at,
			sourceLocale,
			input,
		);
		return { success: true, recipe };
	} catch (error) {
		// Roll back the transaction for any failure during update flow.
		await client.query("ROLLBACK");

		// PostgreSQL 23503 = foreign_key_violation (e.g. unknown ingredient/category id).
		if (isForeignKeyViolation(error)) {
			return { success: false, reason: "invalid-data" };
		}

		console.error("Database error in updateRecipe:", error);
		throw error;
	} finally {
		client.release();
	}
};

export const archiveRecipe = async (
	recipeId: number,
	requesterId: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<ArchiveRecipeResult> => {
	try {
		const requesterResult = await pool.query(
			`SELECT role FROM users WHERE id = $1`,
			[requesterId],
		);

		if (requesterResult.rowCount === 0) {
			return { success: false, reason: "forbidden" };
		}

		const requesterParsed = requesterRoleRowSchema.safeParse(
			requesterResult.rows[0],
		);
		if (!requesterParsed.success) {
			throw new Error(z.prettifyError(requesterParsed.error));
		}

		const isAdmin = requesterParsed.data.role === "admin";

		const updateResult = await pool.query(
			`
      UPDATE recipes
      SET status = 'archived', updated_at = now()
      WHERE id = $1
        AND status <> 'archived'
        AND (author_id = $2 OR $3::boolean)
      RETURNING id
    `,
			[recipeId, requesterId, isAdmin],
		);

		if (updateResult.rowCount === 0) {
			// Nothing archived: classify not-found vs forbidden vs already archived.
			return classifyNoRowsRecipeMutation(recipeId, requesterId, {
				isAdmin,
				priorityInvalidStatuses: ["archived"],
			});
		}

		const recipe = await getRecipeWithIngredientsById(recipeId, locale);
		if (!recipe) {
			throw new Error(`Archived recipe ${recipeId} could not be loaded`);
		}

		return { success: true, recipe };
	} catch (error) {
		console.error("Database error in archiveRecipe:", error);
		throw error;
	}
};

export const addRecipeToFavorites = async (
	recipeId: number,
	userId: number,
): Promise<AddFavoriteResult> => {
	try {
		const recipeExists = await publishedRecipeExists(recipeId);
		if (!recipeExists) {
			return { success: false, reason: "not-found" };
		}

		await pool.query(
			`INSERT INTO favorites (user_id, recipe_id) VALUES ($1, $2)`,
			[userId, recipeId],
		);

		return { success: true, recipeId };
	} catch (error) {
		if (isUniqueViolation(error)) {
			return { success: false, reason: "already-favorited" };
		}

		console.error("Database error in addRecipeToFavorites:", error);
		throw error;
	}
};

export const removeRecipeFromFavorites = async (
	recipeId: number,
	userId: number,
): Promise<RemoveFavoriteResult> => {
	try {
		const recipeExists = await publishedRecipeExists(recipeId);
		if (!recipeExists) {
			return { success: false, reason: "not-found" };
		}

		const deleteResult = await pool.query(
			`DELETE FROM favorites WHERE user_id = $1 AND recipe_id = $2 RETURNING recipe_id`,
			[userId, recipeId],
		);

		if (deleteResult.rowCount === 0) {
			return { success: false, reason: "not-favorited" };
		}

		return { success: true, recipeId };
	} catch (error) {
		console.error("Database error in removeRecipeFromFavorites:", error);
		throw error;
	}
};

export const getMyFavoriteRecipes = async (
	userId: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<FavoriteRecipeListItem[]> => {
	try {
		const query = `
	SELECT
		r.id,
		COALESCE(r.title->>$2, r.title->>'en') AS title,
		COALESCE(r.description->>$2, r.description->>'en') AS description,
		u.avatar
      FROM favorites f
      JOIN recipes r ON r.id = f.recipe_id
      LEFT JOIN users u ON u.id = r.author_id
      WHERE f.user_id = $1 AND r.status = 'published'
      ORDER BY f.created_at DESC
    `;

		const result = await pool.query(query, [userId, locale]);

		return parseRecipeRows(
			result.rows,
			favoriteRecipeListItemSchema,
			"favorite recipe",
		);
	} catch (error) {
		console.error("Database error in getMyFavoriteRecipes:", error);
		throw error;
	}
};

export const getFavoriteRecipesByUserId = async (
	userId: number,
	currentUserId: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<FavoriteRecipeListItem[] | null> => {
	try {
		// Check if target user exists
		const userCheckResult = await pool.query(
			"SELECT id FROM users WHERE id = $1",
			[userId],
		);

		if (userCheckResult.rows.length === 0) {
			const error: ErrorWithCode = new Error("User not found");
			error.code = USER_NOT_FOUND_CODE;
			throw error;
		}

		const isMutualFollow = await areMutualFollowers(currentUserId, userId);
		if (!isMutualFollow) {
			// Not mutual followers - access denied
			return null;
		}

		const query = `
	SELECT
		r.id,
		COALESCE(r.title->>$2, r.title->>'en') AS title,
		COALESCE(r.description->>$2, r.description->>'en') AS description,
		u.avatar
      FROM favorites f
      JOIN recipes r ON r.id = f.recipe_id
      LEFT JOIN users u ON u.id = r.author_id
      WHERE f.user_id = $1 AND r.status = 'published'
      ORDER BY f.created_at DESC
    `;

		const result = await pool.query(query, [userId, locale]);

		return parseRecipeRows(
			result.rows,
			favoriteRecipeListItemSchema,
			"favorite recipe",
		);
	} catch (error) {
		const isUserNotFoundError =
			error instanceof Error &&
			"code" in error &&
			error.code === USER_NOT_FOUND_CODE;

		if (!isUserNotFoundError) {
			console.error("Database error in getFavoriteRecipesByUserId:", error);
		}
		throw error;
	}
};

export const leaveRecipeReview = async (
	recipeId: number,
	userId: number,
	input: CreateRecipeReviewInput,
): Promise<LeaveRecipeReviewResult> => {
	try {
		const authorExists = await userExists(userId);
		if (!authorExists) {
			return { success: false, reason: "unauthorized" };
		}

		const recipeIsPublished = await publishedRecipeExists(recipeId);
		if (!recipeIsPublished) {
			return { success: false, reason: "not-found" };
		}

		const result = await pool.query(
			`
			INSERT INTO recipe_reviews (recipe_id, author_id, body)
			VALUES ($1, $2, $3)
			RETURNING id
		`,
			[recipeId, userId, input.body],
		);

		const reviewIdParsed = recipeIdRowSchema.safeParse(result.rows[0]);
		if (!reviewIdParsed.success) {
			throw new Error(z.prettifyError(reviewIdParsed.error));
		}

		return { success: true, reviewId: reviewIdParsed.data.id };
	} catch (error) {
		console.error("Database error in leaveRecipeReview:", error);
		throw error;
	}
};

export const getRecipeReviews = async (
	recipeId: number,
): Promise<RecipeReviewListItem[] | null> => {
	try {
		const recipeIsPublished = await publishedRecipeExists(recipeId);
		if (!recipeIsPublished) {
			return null;
		}

		const result = await pool.query(
			`
			SELECT
				rr.id,
				rr.recipe_id,
				rr.author_id,
				u.username,
				u.avatar,
				rrt.rating,
				rr.body,
				rr.created_at,
				rr.updated_at
			FROM recipe_reviews rr
			LEFT JOIN users u ON u.id = rr.author_id
			LEFT JOIN recipe_ratings rrt
				ON rrt.recipe_id = rr.recipe_id
				AND rrt.user_id = rr.author_id
			WHERE rr.recipe_id = $1 AND rr.is_deleted = false
			ORDER BY rr.created_at DESC
		`,
			[recipeId],
		);

		return parseRecipeRows(
			result.rows,
			recipeReviewListItemSchema,
			"recipe review",
		);
	} catch (error) {
		console.error("Database error in getRecipeReviews:", error);
		throw error;
	}
};

/**
 * Update a specific review
 *
 * Access rules:
 * - Only the review author can update it
 * - Review must belong to the given recipe and not be soft-deleted
 *
 * Returns:
 * - { success: true, review } on success
 * - { success: false, reason: "not-found" } if review doesn't exist or is deleted
 * - { success: false, reason: "forbidden" } if user doesn't own the review
 */
export const updateReview = async (
	recipeId: number,
	reviewId: number,
	userId: number,
	input: UpdateRecipeReviewInput,
): Promise<UpdateReviewResult> => {
	try {
		const existingResult = await pool.query(
			`SELECT author_id FROM recipe_reviews WHERE id = $1 AND recipe_id = $2 AND is_deleted = false`,
			[reviewId, recipeId],
		);

		if (existingResult.rowCount === 0) {
			return { success: false, reason: "not-found" };
		}

		const { author_id } = existingResult.rows[0];
		if (author_id !== userId) {
			return { success: false, reason: "forbidden" };
		}

		await pool.query(
			`
			UPDATE recipe_reviews
			SET body = $1, updated_at = now()
			WHERE id = $2
			RETURNING id, recipe_id, author_id, body, created_at, updated_at
		`,
			[input.body, reviewId],
		);

		// Join user data to match the RecipeReviewListItem shape
		const reviewResult = await pool.query(
			`
			SELECT
				rr.id,
				rr.recipe_id,
				rr.author_id,
				u.username,
				u.avatar,
				rrt.rating,
				rr.body,
				rr.created_at,
				rr.updated_at
			FROM recipe_reviews rr
			LEFT JOIN users u ON u.id = rr.author_id
			LEFT JOIN recipe_ratings rrt
				ON rrt.recipe_id = rr.recipe_id
				AND rrt.user_id = rr.author_id
			WHERE rr.id = $1
		`,
			[reviewId],
		);

		const reviewParsed = recipeReviewListItemSchema.safeParse(
			reviewResult.rows[0],
		);
		if (!reviewParsed.success) {
			throw new Error(z.prettifyError(reviewParsed.error));
		}

		return { success: true, review: reviewParsed.data };
	} catch (error) {
		console.error("Database error in updateReview:", error);
		throw error;
	}
};

/**
 * Soft-delete a specific review
 *
 * Access rules:
 * - Only the review author can delete it
 * - Review must belong to the given recipe and not already be deleted
 *
 * Uses soft-delete (is_deleted = true) to preserve data integrity
 * and keep review history for audit purposes.
 *
 * Returns:
 * - { success: true } on success
 * - { success: false, reason: "not-found" } if review doesn't exist or is already deleted
 * - { success: false, reason: "forbidden" } if user doesn't own the review
 */
export const deleteReview = async (
	recipeId: number,
	reviewId: number,
	userId: number,
): Promise<DeleteReviewResult> => {
	try {
		// Check review exists, belongs to recipe, is not deleted, and get its author
		const existingResult = await pool.query(
			`SELECT author_id FROM recipe_reviews WHERE id = $1 AND recipe_id = $2 AND is_deleted = false`,
			[reviewId, recipeId],
		);

		if (existingResult.rowCount === 0) {
			return { success: false, reason: "not-found" };
		}

		const { author_id } = existingResult.rows[0];
		if (author_id !== userId) {
			return { success: false, reason: "forbidden" };
		}

		const updateResult = await pool.query(
			`UPDATE recipe_reviews
			 SET is_deleted = true, updated_at = now()
			 WHERE id = $1
			 RETURNING id, recipe_id, updated_at`,
			[reviewId],
		);

		const resultRow = updateResult.rows[0] as {
			id: number;
			recipe_id: number;
			updated_at: string | Date;
		};

		return {
			success: true,
			reviewId: resultRow.id,
			recipeId: resultRow.recipe_id,
			updatedAt: new Date(resultRow.updated_at).toISOString(),
		};
	} catch (error) {
		console.error("Database error in deleteReview:", error);
		throw error;
	}
};

/**
 * Get a specific recipe by ID
 *
 * Access rules:
 * - Guest (userId undefined): sees only published recipes
 * - User (userId = "123"): sees their own recipes (any status) + others' published
 * - Non-existent recipe: returns null (404)
 * - Existing but restricted recipe: returns { restricted: true } (403)
 *
 * Parameters:
 * - id: number - recipe integer ID from URL params (validated and coerced)
 * - userId?: number - user ID (undefined if guest)
 *
 * | - means "OR" (union type), can be one of three:
 * Recipe - normal recipe
 * { restricted: true } - recipe exists but is closed
 * null - recipe doesn't exist at all
 */
export const getRecipeById = async (
	id: number,
	userId?: number,
	locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<Recipe | { restricted: true } | null> => {
	try {
		const visibilityResult = await pool.query(
			`SELECT author_id, status FROM recipes WHERE id = $1`,
			[id],
		);

		if (visibilityResult.rows.length === 0) {
			return null;
		}

		const recipeVisibilityParsed = recipeVisibilityRowSchema.safeParse(
			visibilityResult.rows[0],
		);
		if (!recipeVisibilityParsed.success) {
			throw new Error(z.prettifyError(recipeVisibilityParsed.error));
		}

		const recipeVisibility = recipeVisibilityParsed.data;

		const isOwner =
			userId !== undefined && recipeVisibility.author_id === userId;
		const isPublished = recipeVisibility.status === "published";

		if (!isPublished && !isOwner) {
			return { restricted: true };
		}

		return getRecipeWithIngredientsById(id, locale);
	} catch (error) {
		console.error("Database error in getRecipeById:", error);
		throw error;
	}
};

/**
 * Get all published recipes for search indexing.
 *
 * This is an internal-only read model used by search-service.
 * It exposes just enough data to build embeddings and track freshness.
 */
export const getSearchRecipes = async (): Promise<SearchRecipeDocument[]> => {
	try {
		const query = `
			SELECT
				r.id,
				COALESCE(
					r.title->>'en',
					r.title->>'fi',
					r.title->>'ru'
				) AS title,
				COALESCE(
					r.description->>'en',
					r.description->>'fi',
					r.description->>'ru'
				) AS description,
				COALESCE(
					r.instructions->'en',
					r.instructions->'fi',
					r.instructions->'ru',
					'[]'::jsonb
				) AS instructions,
				r.author_id,
				r.servings,
				r.spiciness,
				r.rating_avg,
				COALESCE(
					(
						SELECT json_agg(
							json_build_object(
								'ingredient_id', ri.ingredient_id,
								'name', i.name,
								'amount', ri.amount,
								'unit', ri.unit
							)
							ORDER BY ri.ingredient_id
						)
						FROM recipe_ingredients ri
						JOIN ingredients i ON i.id = ri.ingredient_id
						WHERE ri.recipe_id = r.id
					),
					'[]'::json
				) AS ingredients,
				COALESCE(
					(
						SELECT json_agg(
							json_build_object(
								'id', rc.id,
								'code', rc.code,
								'category_type_id', rct.id,
								'category_type_code', rct.code,
								'category_type_name', rct.name
							)
							ORDER BY rct.id, rc.id
						)
						FROM recipe_category_map rcm
						JOIN recipe_categories rc ON rc.id = rcm.category_id
						JOIN recipe_category_types rct ON rct.id = rc.category_type_id
						WHERE rcm.recipe_id = r.id
					),
					'[]'::json
				) AS categories,
				r.updated_at
			FROM recipes r
			WHERE r.status = 'published'
			ORDER BY r.updated_at DESC, r.id DESC
		`;

		const result = await pool.query(query);

		return parseRecipeRows(
			result.rows,
			searchRecipeDocumentSchema,
			"search recipe document",
		);
	} catch (error) {
		console.error("Database error in getSearchRecipes:", error);
		throw error;
	}
};

/**
 * Get one published recipe for targeted search reindex.
 */
export const getSearchRecipeById = async (
	id: number,
): Promise<SearchRecipeDocument | null> => {
	try {
		const query = `
			SELECT
				r.id,
				COALESCE(
					r.title->>'en',
					r.title->>'fi',
					r.title->>'ru'
				) AS title,
				COALESCE(
					r.description->>'en',
					r.description->>'fi',
					r.description->>'ru'
				) AS description,
				COALESCE(
					r.instructions->'en',
					r.instructions->'fi',
					r.instructions->'ru',
					'[]'::jsonb
				) AS instructions,
				r.author_id,
				r.servings,
				r.spiciness,
				r.rating_avg,
				COALESCE(
					(
						SELECT json_agg(
							json_build_object(
								'ingredient_id', ri.ingredient_id,
								'name', i.name,
								'amount', ri.amount,
								'unit', ri.unit
							)
							ORDER BY ri.ingredient_id
						)
						FROM recipe_ingredients ri
						JOIN ingredients i ON i.id = ri.ingredient_id
						WHERE ri.recipe_id = r.id
					),
					'[]'::json
				) AS ingredients,
				COALESCE(
					(
						SELECT json_agg(
							json_build_object(
								'id', rc.id,
								'code', rc.code,
								'category_type_id', rct.id,
								'category_type_code', rct.code,
								'category_type_name', rct.name
							)
							ORDER BY rct.id, rc.id
						)
						FROM recipe_category_map rcm
						JOIN recipe_categories rc ON rc.id = rcm.category_id
						JOIN recipe_category_types rct ON rct.id = rc.category_type_id
						WHERE rcm.recipe_id = r.id
					),
					'[]'::json
				) AS categories,
				r.updated_at
			FROM recipes r
			WHERE r.id = $1 AND r.status = 'published'
		`;

		const result = await pool.query(query, [id]);

		if (result.rows.length === 0) {
			return null;
		}

		const validation = searchRecipeDocumentSchema.safeParse(result.rows[0]);
		if (!validation.success) {
			console.error(
				`Invalid search recipe document for ID ${id}:`,
				z.prettifyError(validation.error),
			);
			return null;
		}

		return validation.data;
	} catch (error) {
		console.error("Database error in getSearchRecipeById:", error);
		throw error;
	}
};

export const updateRecipePicture = async (
	recipeId: number,
	userId: number,
	pictureUrl: string,
): Promise<UpdateRecipePictureResult> => {
	try {
		const existingResult = await pool.query(
			`SELECT author_id, status FROM recipes WHERE id = $1`,
			[recipeId],
		);

		if (existingResult.rowCount === 0) {
			return { success: false, reason: "not-found" };
		}

		const existingParsed = recipeVisibilityRowSchema.safeParse(
			existingResult.rows[0],
		);
		if (!existingParsed.success) {
			throw new Error(z.prettifyError(existingParsed.error));
		}

		const { author_id, status } = existingParsed.data;

		if (author_id !== userId) {
			return { success: false, reason: "forbidden" };
		}

		if (status !== "draft" && status !== "published") {
			return {
				success: false,
				reason: "invalid-status",
				currentStatus: status,
			};
		}

		// Fetch existing picture URL before upserting so we can delete the old file
		const existingMediaResult = await pool.query(
			`SELECT url FROM recipe_media WHERE recipe_id = $1 AND position = 0`,
			[recipeId],
		);
		const oldPictureUrl: string | null =
			existingMediaResult.rows[0]?.url ?? null;

		await pool.query(
			`
      INSERT INTO recipe_media (recipe_id, type, url, position)
      VALUES ($1, 'image', $2, 0)
      ON CONFLICT (recipe_id, position)
      DO UPDATE SET url = EXCLUDED.url
      `,
			[recipeId, pictureUrl],
		);

		// Delete old file from disk if it existed and differs from the new one
		if (oldPictureUrl && oldPictureUrl !== pictureUrl) {
			const oldFilename = oldPictureUrl.replace("/recipe-pictures/", "");
			const oldFilePath = path.resolve("uploads/recipes", oldFilename);
			await fs.promises.unlink(oldFilePath).catch((err) => {
				if (err.code !== "ENOENT") {
					console.error("Failed to delete old recipe picture:", err);
				}
			});
		}

		return { success: true };
	} catch (error) {
		console.error("Database error in updateRecipePicture:", error);
		throw error;
	}
};

export const getCategoryList = async (
	categoryTypeCode: string,
): Promise<{ [key: string]: string[] }> => {
	try {
		const result = await pool.query<{ code: string }>(
			`
			SELECT rc.code
			FROM recipe_categories rc
			JOIN recipe_category_types rct ON rct.id = rc.category_type_id
			WHERE rct.code = $1
			ORDER BY rc.code ASC
			`,
			[categoryTypeCode],
		);

		const codes = result.rows.map((row) => row.code);
		return { [categoryTypeCode]: codes };
	} catch (error) {
		console.error(
			`Database error in getCategoryList(${categoryTypeCode}):`,
			error,
		);
		throw error;
	}
};

export const getIngredientList = async (): Promise<{
	ingredients: { id: number; name: string }[];
}> => {
	try {
		const result = await pool.query<{ id: number; name: string }>(
			`SELECT id, name FROM ingredients ORDER BY name ASC`,
		);
		return { ingredients: result.rows };
	} catch (error) {
		console.error("Database error in getIngredientList:", error);
		throw error;
	}
};
