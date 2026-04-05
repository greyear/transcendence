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

import type { PoolClient } from "pg";
import { z } from "zod";
import { pool } from "../db/database.js";
import {
	type CreateRecipeInput,
	type MyRecipeListItem,
	myRecipeListItemSchema,
	type Recipe,
	type RecipeListItem,
	recipeListItemSchema,
	recipeSchema,
	recipeStatusSchema,
	type UpdateRecipeInput,
} from "../validation/schemas.js";

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
		r.title,
		r.description,
		r.instructions,
		r.servings,
		r.spiciness,
		r.author_id,
		r.rating_avg,
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
	client?: PoolClient,
): Promise<Recipe | null> => {
	const db = client ?? pool;
	const result = await db.query(getRecipeWithIngredientsQuery, [recipeId]);

	if (result.rows.length === 0) {
		return null;
	}

	return parseRecipeRow(result.rows[0], `ID ${recipeId}`);
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
export const getAllRecipes = async (): Promise<RecipeListItem[]> => {
	try {
		// SQL query - get only published recipes (status = 'published')
		// ORDER BY created_at DESC - newest first
		const query = `
      SELECT id, title, description, author_id, rating_avg
      FROM recipes
      WHERE status = 'published'
      ORDER BY created_at DESC
    `;

		// pool.query(query) - execute SQL
		// result.rows - array of rows from result
		const result = await pool.query(query);

		return parseRecipeRows(result.rows, recipeListItemSchema, "recipe");
	} catch (error) {
		// If error - log it and throw it to caller
		console.error("Database error in getAllRecipes:", error);
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
): Promise<RecipeListItem[] | null> => {
	try {
		const exists = await userExists(userId);
		if (!exists) {
			return null;
		}

		const query = `
      SELECT id, title, description, author_id, rating_avg
      FROM recipes
      WHERE author_id = $1 AND status = 'published'
      ORDER BY created_at DESC
    `;

		const result = await pool.query(query, [userId]);

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
): Promise<MyRecipeListItem[]> => {
	try {
		const query = `
      SELECT id, title, description, author_id, rating_avg, status
      FROM recipes
      WHERE author_id = $1
      ORDER BY created_at DESC
    `;

		const result = await pool.query(query, [userId]);

		return parseRecipeRows(result.rows, myRecipeListItemSchema, "my recipe");
	} catch (error) {
		console.error("Database error in getMyRecipes:", error);
		throw error;
	}
};

export const createRecipe = async (
	userId: number,
	input: CreateRecipeInput,
): Promise<Recipe> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const result = await client.query(
			`
      INSERT INTO recipes (title, description, instructions, servings, spiciness, author_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft')
      RETURNING id
    `,
			[
				input.title,
				input.description,
				input.instructions,
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

		const recipe = await getRecipeWithIngredientsById(recipeId, client);
		if (!recipe) {
			throw new Error(`Created recipe ${recipeId} could not be loaded`);
		}

		await client.query("COMMIT");
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

		const recipe = await getRecipeWithIngredientsById(recipeId);
		if (!recipe) {
			throw new Error(`Updated recipe ${recipeId} could not be loaded`);
		}

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
): Promise<UpdateRecipeResult> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

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
      RETURNING id
    `,
			[
				input.title,
				input.description,
				input.instructions,
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

		const recipe = await getRecipeWithIngredientsById(recipeId, client);
		if (!recipe) {
			throw new Error(`Updated recipe ${recipeId} could not be loaded`);
		}

		await client.query("COMMIT");
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

		const recipe = await getRecipeWithIngredientsById(recipeId);
		if (!recipe) {
			throw new Error(`Archived recipe ${recipeId} could not be loaded`);
		}

		return { success: true, recipe };
	} catch (error) {
		console.error("Database error in archiveRecipe:", error);
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

		return getRecipeWithIngredientsById(id);
	} catch (error) {
		console.error("Database error in getRecipeById:", error);
		throw error;
	}
};
