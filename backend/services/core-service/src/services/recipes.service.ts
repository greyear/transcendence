/**
 * Recipes Service (Business Logic Layer)
 * 
 * Contains business logic for working with recipes:
 * - Database queries
 * - Access control checks (guests see only published recipes)
 * - Returning data in correct format
 * 
 * TypeScript benefits:
 * - Interface RecipeRow - describes database data structure
 * - Async/await with typing guarantees function returns Promise
 * - Function parameters are type-safe (id: string, userId: string | null)
 */

import pool from "../db/database.js";
import { Recipe } from "../validation/schemas.js";

/**
 * INTERFACE - describes how a Recipe object looks when coming from database
 * 
 * This differs from Recipe type in schemas.ts!
 * RecipeRow - what database returns
 * Recipe - what we send to client (might be different)
 * 
 * ? after field - means optional field (can be undefined)
 */
interface RecipeRow {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  servings?: number;
  spiciness?: number;
  author_id: string;
  rating_avg?: number;
  status?: string;
}

/**
 * RecipeListItem - minimal recipe info for list view
 * Used by getAllRecipes() - doesn't include full details
 */
interface RecipeListItem {
  id: string;
  title: string;
  description?: string;
  author_id: string;
  rating_avg?: number;
}

/**
 * Get ALL published recipes
 * 
 * async - function is asynchronous (executes over time, not immediately)
 * Promise<RecipeListItem[]> - returns minimal recipe info (not full RecipeRow)
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
    return result.rows;
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
 * - Guest (userId = null): sees only published recipes
 * - User (userId = "123"): sees their own recipes (any status) + others' published
 * - Non-existent recipe: returns null (404)
 * - Existing but restricted recipe: returns { restricted: true } (403)
 * 
 * Parameters:
 * - id: string - recipe UUID
 * - userId: string | null = null - user ID (null if guest)
 * 
 * | - means "OR" (union type), can be one of three:
 * RecipeRow - normal recipe
 * { restricted: true } - recipe exists but is closed
 * null - recipe doesn't exist at all
 */
export const getRecipeById = async (
  id: string,
  userId: string | null = null
): Promise<RecipeRow | { restricted: true } | null> => {
  try {
    let query: string;
    let params: (string | null)[];

    if (userId) {
      // User is authenticated - show own drafts OR others' published recipes
      query = `
        SELECT id, title, description, instructions, servings, 
               spiciness, author_id, rating_avg, status
        FROM recipes
        WHERE id = $1 AND (author_id = $2 OR status = 'published')
      `;
      params = [id, userId];
    } else {
      // Guest - only published recipes
      query = `
        SELECT id, title, description, instructions, servings, 
               spiciness, author_id, rating_avg
        FROM recipes
        WHERE id = $1 AND status = 'published'
      `;
      params = [id];
    }

    // Execute query
    const result = await pool.query(query, params);

    // If recipe found and accessible - return it
    if (result.rows.length > 0) {
      return result.rows[0];
    }

    // Recipe not found - check if it exists at all
    // This is needed to distinguish between:
    // - 404: recipe doesn't exist at all
    // - 403: recipe exists but not accessible (draft from another user)
    const existsResult = await pool.query(
      `SELECT id, status, author_id FROM recipes WHERE id = $1`,
      [id]
    );

    if (existsResult.rows.length > 0) {
      // Recipe exists but not accessible to this user
      return { restricted: true };
    }

    // Recipe doesn't exist at all
    return null;
  } catch (error) {
    console.error("Database error in getRecipeById:", error);
    throw error;
  }
};
