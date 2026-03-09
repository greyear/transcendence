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
	type Recipe,
	type RecipeListItem,
	recipeListItemSchema,
	recipeSchema,
} from "../validation/schemas.js";

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

		// Validate each recipe with Zod
		// Skip invalid recipes instead of crashing the endpoint
		const validatedRows = result.rows.reduce<RecipeListItem[]>((acc, row) => {
			const validation = recipeListItemSchema.safeParse(row);
			if (validation.success) {
				acc.push(validation.data);
			} else {
				// Log the error for maintenance without crashing the app
				console.error(
					`Skipping invalid recipe ID ${row?.id ?? "unknown"}:`,
					z.prettifyError(validation.error),
				);
			}
			return acc;
		}, []);

		return validatedRows;
	} catch (error) {
		// If error - log it and throw it to caller
		console.error("Database error in getAllRecipes:", error);
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
