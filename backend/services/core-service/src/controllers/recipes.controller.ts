/**
 * Recipes Controller (API Handlers)
 * 
 * Controller - functions that handle HTTP requests
 * 
 * Data flow:
 * 1. Request comes in → Router calls Controller
 * 2. Controller validates data
 * 3. Controller calls Service for data operations
 * 4. Controller sends HTTP response to client
 * 
 * TypeScript benefits:
 * - Request, Response, NextFunction are typed from express
 * - Function parameters are explicitly typed
 * - Void means function returns nothing (sends res.json instead of return)
 */

import { Request, Response, NextFunction } from "express";
import * as recipesService from "../services/recipes.service.js";
import { validateRecipeId } from "../validation/schemas.js";

/**
 * INTERFACE for type-safe errors
 * extends Error - inherits from built-in Error
 * statusCode? - add statusCode property (optional)
 */
interface CustomError extends Error {
  statusCode?: number;
}

/**
 * GET /recipes - get ALL published recipes
 * 
 * Parameters:
 * - req: Request - request object (contains headers, body, params)
 * - res: Response - response object (use res.json(), res.status())
 * - next: NextFunction - pass error to error handler (next(error))
 * 
 * Promise<void> - async function that returns nothing
 * (returns Promise but we don't use return, instead send res.json())
 */
export const getAllRecipes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Call service to get all recipes from database
    const recipes = await recipesService.getAllRecipes();

    // Send JSON response to client
    // res.status(200) - OK
    // res.json() - convert object to JSON and send
    res.status(200).json({ data: recipes, count: recipes.length });
  } catch (error) {
    // If error occurred - pass it to error handler middleware
    next(error);
  }
};

/**
 * GET /recipes/:id - get a specific recipe by ID
 * 
 * Checks:
 * 1. ID is valid UUID
 * 2. User has access (guest sees only published)
 * 3. Returns 404 if not found, 403 if restricted, 200 if OK
 */
export const getRecipeById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get ID from URL parameter (/recipes/550e8400-e29b-41d4-a716-446655440000)
    const { id } = req.params;

    // 2. VALIDATE that ID is a valid UUID
    const validation = validateRecipeId(id);
    if (!validation.valid) {
      // If not a valid UUID - this is a 400 error (Bad Request)
      const error: CustomError = new Error(validation.error);
      error.statusCode = 400;
      throw error;
    }

    // 3. Get userId from middleware (extractUser set it in req.userId)
    // req.userId can be string (user ID) or null (guest)
    const userId = req.userId || null;

    // 4. Call service to get recipe from database
    // Pass userId so service knows which recipe to show
    const recipe = await recipesService.getRecipeById(validation.value, userId);

    // 5. CHECK result and send proper HTTP status

    // If recipe = null - means it doesn't exist (404 Not Found)
    if (!recipe) {
      const error: CustomError = new Error("Recipe not found");
      error.statusCode = 404;
      throw error;
    }

    // If recipe has field restricted = true - means recipe exists
    // but user doesn't have access (403 Forbidden)
    // in operator - check if property exists in object
    if ("restricted" in recipe && recipe.restricted) {
      const error: CustomError = new Error("Access to this recipe is restricted");
      error.statusCode = 403;
      throw error;
    }

    // All OK - send recipe to client
    res.status(200).json({ data: recipe });
  } catch (error) {
    // If error occurred - pass to error handler
    next(error);
  }
};
