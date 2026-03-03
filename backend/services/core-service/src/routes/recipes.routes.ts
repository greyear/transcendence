/**
 * Recipes Routes
 * 
 * Define routes for all recipe operations:
 * - GET /recipes - all recipes
 * - GET /recipes/:id - specific recipe
 * 
 * Routes - are URL endpoints that the app handles
 * 
 * TypeScript benefits:
 * - Router is typed
 * - Middleware parameters have correct types
 */

import { Router } from "express";
import { getAllRecipes, getRecipeById } from "../controllers/recipes.controller.js";
import { extractUser } from "../middleware/extractUser.js";

// Create router for recipe endpoints
// Router - object that contains routes
export const recipesRouter: Router = Router();

/**
 * GET /recipes - fetch all published recipes
 * 
 * Usage:
 * GET http://localhost:3002/recipes
 * 
 * Response:
 * { data: [{...}, {...}], count: 2 }
 * 
 * Note: No authentication needed - returns only published recipes
 */
recipesRouter.get("/", getAllRecipes);

/**
 * GET /recipes/:id - fetch a specific recipe by id
 * 
 * :id - URL parameter (example /recipes/550e8400-e29b-41d4-a716-446655440000)
 * 
 * Usage:
 * GET http://localhost:3002/recipes/550e8400-e29b-41d4-a716-446655440000
 * 
 * Response:
 * { data: {...} }
 * 
 * Errors:
 * - 400 Bad Request - if ID is not a valid UUID
 * - 403 Forbidden - if recipe is restricted (draft of another user)
 * - 404 Not Found - if recipe doesn't exist
 * 
 * Note: extractUser middleware extracts userId from X-User-Id header
 * This is needed to determine access rights (own drafts vs others' published recipes)
 */
recipesRouter.get("/:id", extractUser, getRecipeById);
