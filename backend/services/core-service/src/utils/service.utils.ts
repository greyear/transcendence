import { z } from "zod";
import { pool } from "../db/database.js";

const mutualFollowersRowSchema = z.object({
	are_mutual: z.boolean(),
});

/**
 * Check if two users follow each other (mutual follow relationship).
 * Returns true only if both follow records exist.
 */
export const areMutualFollowers = async (
	userId1: number,
	userId2: number,
): Promise<boolean> => {
	try {
		const result = await pool.query(
			`SELECT (
				EXISTS (
					SELECT 1
					FROM followers
					WHERE user_id = $1 AND followed_id = $2
				)
				AND EXISTS (
					SELECT 1
					FROM followers
					WHERE user_id = $2 AND followed_id = $1
				)
			) AS are_mutual`,
			[userId1, userId2],
		);

		const parsed = mutualFollowersRowSchema.safeParse(result.rows[0]);
		if (!parsed.success) {
			throw new Error(z.prettifyError(parsed.error));
		}

		return parsed.data.are_mutual;
	} catch (error) {
		console.error("Database error in areMutualFollowers:", error);
		throw error;
	}
};
