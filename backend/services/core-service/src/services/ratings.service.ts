/**
 * Ratings Service (Business Logic Layer)
 *
 * Handles rating operations for recipes:
 * - Create, update, delete a user's rating
 * - Recalculate recipe's rating_avg and rating_count after each mutation
 *
 * Recalculation runs inside the same transaction as the mutation so the
 * denormalized columns on the recipes table are always consistent with
 * the recipe_ratings rows.
 */

import type { PoolClient } from "pg";
import { pool } from "../db/database.js";

// ── Result types ──────────────────────────────────────────────────────────────

export type RatingMutationResult =
	| { success: true }
	| { success: false; reason: "not-found" | "conflict" | "not-rated" };

// ── Internal helpers ──────────────────────────────────────────────────────────

/** PostgreSQL SQLSTATE for unique_violation. */
const PG_UNIQUE_VIOLATION = "23505";

const isUniqueViolation = (error: unknown): boolean =>
	!!error &&
	typeof error === "object" &&
	"code" in error &&
	error.code === PG_UNIQUE_VIOLATION;

const recipeExists = async (recipeId: number): Promise<boolean> => {
	const result = await pool.query(
		`SELECT 1 FROM recipes WHERE id = $1 LIMIT 1`,
		[recipeId],
	);
	return result.rowCount === 1;
};

/**
 * Recalculates rating_avg and rating_count on the recipe row.
 * Must be called within an open transaction via the supplied client.
 */
const recalculateRecipeRating = async (
	recipeId: number,
	client: PoolClient,
): Promise<void> => {
	await client.query(
		`
    UPDATE recipes
    SET
      rating_avg   = (SELECT AVG(rating)  FROM recipe_ratings WHERE recipe_id = $1),
      rating_count = (SELECT COUNT(*)     FROM recipe_ratings WHERE recipe_id = $1),
      updated_at   = now()
    WHERE id = $1
  `,
		[recipeId],
	);
};

// ── Exported service functions ────────────────────────────────────────────────

/**
 * Create a rating for a recipe.
 *
 * Failures:
 * - not-found : recipe does not exist
 * - conflict  : user already rated this recipe
 */
export const createRating = async (
	recipeId: number,
	userId: number,
	rating: number,
): Promise<RatingMutationResult> => {
	if (!(await recipeExists(recipeId))) {
		return { success: false, reason: "not-found" };
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		await client.query(
			`INSERT INTO recipe_ratings (recipe_id, user_id, rating) VALUES ($1, $2, $3)`,
			[recipeId, userId, rating],
		);

		await recalculateRecipeRating(recipeId, client);

		await client.query("COMMIT");
		return { success: true };
	} catch (error) {
		await client.query("ROLLBACK");

		if (isUniqueViolation(error)) {
			return { success: false, reason: "conflict" };
		}

		console.error("Database error in createRating:", error);
		throw error;
	} finally {
		client.release();
	}
};

/**
 * Update an existing rating for a recipe.
 *
 * Failures:
 * - not-found : recipe does not exist
 * - not-rated : user has not rated this recipe yet
 */
export const updateRating = async (
	recipeId: number,
	userId: number,
	rating: number,
): Promise<RatingMutationResult> => {
	if (!(await recipeExists(recipeId))) {
		return { success: false, reason: "not-found" };
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const result = await client.query(
			`
      UPDATE recipe_ratings
      SET rating = $1, updated_at = now()
      WHERE recipe_id = $2 AND user_id = $3
      RETURNING recipe_id
    `,
			[rating, recipeId, userId],
		);

		if (result.rowCount === 0) {
			await client.query("ROLLBACK");
			return { success: false, reason: "not-rated" };
		}

		await recalculateRecipeRating(recipeId, client);

		await client.query("COMMIT");
		return { success: true };
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Database error in updateRating:", error);
		throw error;
	} finally {
		client.release();
	}
};

/**
 * Delete a user's rating for a recipe.
 *
 * Failures:
 * - not-found : recipe does not exist
 * - not-rated : user has not rated this recipe
 */
export const deleteRating = async (
	recipeId: number,
	userId: number,
): Promise<RatingMutationResult> => {
	if (!(await recipeExists(recipeId))) {
		return { success: false, reason: "not-found" };
	}

	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const result = await client.query(
			`DELETE FROM recipe_ratings WHERE recipe_id = $1 AND user_id = $2 RETURNING recipe_id`,
			[recipeId, userId],
		);

		if (result.rowCount === 0) {
			await client.query("ROLLBACK");
			return { success: false, reason: "not-rated" };
		}

		await recalculateRecipeRating(recipeId, client);

		await client.query("COMMIT");
		return { success: true };
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Database error in deleteRating:", error);
		throw error;
	} finally {
		client.release();
	}
};
