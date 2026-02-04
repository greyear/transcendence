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
export const getRecipeById = async (id) => {
  try {
    // SQL query to get full recipe details by id
    // Include: id, title, description, instructions, servings, spiciness, author_id, rating_avg
    const query = `
      SELECT id, title, description, instructions, servings, 
             spiciness, author_id, rating_avg
      FROM recipes
      WHERE id = $1 AND status = 'published'
    `;
    
    // $1 is a placeholder for the id parameter (prevents SQL injection)
    const result = await pool.query(query, [id]);
    
    // If no recipe found, return null
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Database error in getRecipeById:", error);
    throw error;
  }
};
