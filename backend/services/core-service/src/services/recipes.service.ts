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
} from "../validation/schemas.js";

type PublishRecipeResult =
	| { success: true; recipe: Recipe }
	| {
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
			const maybeRow =
				typeof row === "object" && row !== null
					? (row as { id?: unknown })
					: null;

			const rowId =
				typeof maybeRow?.id === "number" || typeof maybeRow?.id === "string"
					? maybeRow.id
					: "unknown";

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

		for (const ingredient of input.ingredients) {
			await client.query(
				`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
          VALUES ($1, $2, $3, $4)
        `,
				[
					recipeId,
					ingredient.ingredient_id,
					ingredient.amount,
					ingredient.unit,
				],
			);
		}

		for (const categoryId of input.category_ids) {
			await client.query(
				`
          INSERT INTO recipe_category_map (recipe_id, category_id)
          VALUES ($1, $2)
        `,
				[recipeId, categoryId],
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
		const existingResult = await pool.query(
			`SELECT author_id, status FROM recipes WHERE id = $1`,
			[recipeId],
		);

		if (existingResult.rowCount === 0) {
			return { success: false, reason: "not-found" };
		}

		const existingRecipeParsed = recipeVisibilityRowSchema.safeParse(
			existingResult.rows[0],
		);
		if (!existingRecipeParsed.success) {
			throw new Error(z.prettifyError(existingRecipeParsed.error));
		}

		const existingRecipe = existingRecipeParsed.data;

		if (existingRecipe.author_id !== userId) {
			return { success: false, reason: "forbidden" };
		}

		if (existingRecipe.status !== "draft") {
			return {
				success: false,
				reason: "invalid-status",
				currentStatus: existingRecipe.status,
			};
		}

		const updateResult = await pool.query(
			`
      UPDATE recipes
      SET status = 'moderation', updated_at = now()
      WHERE id = $1
      RETURNING id
    `,
			[recipeId],
		);

		if (updateResult.rowCount === 0) {
			return { success: false, reason: "not-found" };
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
