import pool from "../db/database.js";

// Fetch all published recipes from database
export const getAllRecipes = async () => {
  try {
    // SQL query to get all published recipes with rating
    // Exclude: status (always 'published'), created_at (not needed in list)
    const query = `
      SELECT id, title, description, author_id, rating_avg
      FROM recipes
      WHERE status = 'published'
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database error in getAllRecipes:", error);
    throw error;
  }
};

// Fetch a specific recipe by id
// If userId is provided and matches author_id, returns recipe regardless of status
// Otherwise, only returns published recipes
// Returns: recipe object | null (404 not found) | { restricted: true } (403 forbidden)
export const getRecipeById = async (id, userId = null) => {
  try {
    let query;
    let params;
    
    if (userId) {
      // User is authenticated - show their own drafts, or only published for others
      query = `
        SELECT id, title, description, instructions, servings, 
               spiciness, author_id, rating_avg, status
        FROM recipes
        WHERE id = $1 AND (author_id = $2 OR status = 'published')
      `;
      params = [id, userId];
    } else {
      // Guest - only show published recipes
      query = `
        SELECT id, title, description, instructions, servings, 
               spiciness, author_id, rating_avg
        FROM recipes
        WHERE id = $1 AND status = 'published'
      `;
      params = [id];
    }
    
    const result = await pool.query(query, params);
    
    // Recipe found and matches criteria (published or is author)
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Recipe not found in results - need to check if it exists at all
    // This distinguishes between:
    // - 404: Recipe doesn't exist
    // - 403: Recipe exists but is not accessible (draft from another user)
    const existsResult = await pool.query(
      `SELECT id, status, author_id FROM recipes WHERE id = $1`,
      [id]
    );
    
    if (existsResult.rows.length > 0) {
      // Recipe exists but is not accessible to this user
      return { restricted: true };
    }
    
    // Recipe doesn't exist at all
    return null;
  } catch (error) {
    console.error("Database error in getRecipeById:", error);
    throw error;
  }
};
