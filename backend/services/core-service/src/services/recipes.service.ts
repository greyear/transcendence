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

import { z } from "zod";
import { pool } from "../db/database.js";
import {
	type MyRecipeListItem,
	myRecipeListItemSchema,
	type Recipe,
	type RecipeListItem,
	recipeListItemSchema,
	recipeSchema,
	type SearchRecipeDocument,
	searchRecipeDocumentSchema,
} from "../validation/schemas.js";

const parseRecipeRows = <T>(
	rows: Array<Record<string, unknown>>,
	schema: z.ZodType<T>,
	rowLabel: string,
): T[] => {
	return rows.reduce<T[]>((acc, row) => {
		const validation = schema.safeParse(row);
		if (validation.success) {
			acc.push(validation.data);
		} else {
			const rowId =
				typeof row.id === "number" || typeof row.id === "string"
					? row.id
					: "unknown";

			console.error(
				`Skipping invalid ${rowLabel} ID ${rowId}:`,
				z.prettifyError(validation.error),
			);
		}
		return acc;
	}, []);
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
 * Returns recipes of all statuses (draft, published, archived)
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
		const baseQuery = `
      SELECT id, title, description, instructions, servings,
             spiciness, author_id, rating_avg, status
      FROM recipes
      WHERE id = $1
    `;

		const visibilityFilter = userId
			? `AND (author_id = $2 OR status = 'published')`
			: `AND status = 'published'`;

		const query = `${baseQuery} ${visibilityFilter}`;
		const params = userId ? [id, userId] : [id];

		// Execute query
		const result = await pool.query(query, params);

		if (result.rows.length === 0) {
			// Recipe not found - check if it exists at all
			// This is needed to distinguish between:
			// - 404: recipe doesn't exist at all
			// - 403: recipe exists but not accessible (draft from another user)
			const existsResult = await pool.query(
				`SELECT id, status, author_id FROM recipes WHERE id = $1`,
				[id],
			);

			if (existsResult.rows.length === 0) {
				// Recipe doesn't exist at all
				return null;
			}

			// Recipe exists but not accessible to this user
			return { restricted: true };
		}

		// Validate recipe data with Zod (ensures data structure is correct)
		const validation = recipeSchema.safeParse(result.rows[0]);
		if (!validation.success) {
			// Recipe data from DB doesn't match expected schema
			// Treat corrupted data as if recipe doesn't exist (return null instead of crashing)
			console.error(
				`Invalid recipe data for ID ${id}:`,
				z.prettifyError(validation.error),
			);
			return null;
		}

		return validation.data;
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
      SELECT id, title, description, instructions, updated_at
      FROM recipes
      WHERE status = 'published'
      ORDER BY updated_at DESC, id DESC
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
      SELECT id, title, description, instructions, updated_at
      FROM recipes
      WHERE id = $1 AND status = 'published'
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
