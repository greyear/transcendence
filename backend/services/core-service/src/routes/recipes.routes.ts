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
import * as recipesController from "../controllers/recipes.controller.js";
import { extractUser } from "../middleware/extractUser.js";

// Create router for recipe endpoints
// Router - object that contains routes
export const recipesRouter: Router = Router();

/**
 * MIDDLEWARE on this router - runs BEFORE any route below
 * 
 * router.use(extractUser) means:
 * - For every request to /recipes* first run extractUser
 * - extractUser will add req.userId
 * - Then run the route (GET / or GET /:id)
 */
recipesRouter.use(extractUser);

/**
 * GET /recipes - fetch all published recipes
 * 
 * Usage:
 * GET http://localhost:3002/recipes
 * 
 * Response:
 * { data: [{...}, {...}], count: 2 }
 */
recipesRouter.get("/", recipesController.getAllRecipes);

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
 */
recipesRouter.get("/:id", recipesController.getRecipeById);
