/**
 * Recipes Routes
 *
 * 2-layer structure:
 * - Routes: HTTP handling + validation + response formatting
 * - Services: business logic + database access
 */

import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import {
	type AuthenticatedRequest,
	extractUser,
} from "../middleware/extractUser.js";
import {
	addRecipeToFavorites,
	archiveRecipe,
	createRecipe,
	getAllRecipes,
	getRecipeById,
	publishRecipe,
	removeRecipeFromFavorites,
	updateRecipe,
} from "../services/recipes.service.js";
import {
	validateCreateRecipeInput,
	validateRecipeId,
	validateUpdateRecipeInput,
} from "../validation/schemas.js";
import { ratingsRouter } from "./ratings.routes.js";

interface CustomError extends Error {
	statusCode?: number;
}

// Create router for recipe endpoints
export const recipesRouter: Router = Router();

const createRecipeHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateCreateRecipeInput(req.body);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const recipe = await createRecipe(req.userId, validation.value);
		res.status(201).json({ data: recipe });
	} catch (error) {
		next(error);
	}
};

const publishRecipeHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateRecipeId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const publishResult = await publishRecipe(validation.value, req.userId);

		if (!publishResult.success) {
			const error: CustomError = new Error();

			switch (publishResult.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "forbidden":
					error.message = "No permission to publish this recipe";
					error.statusCode = 403;
					break;
				default:
					error.message = `Recipe cannot be published from status ${publishResult.currentStatus}`;
					error.statusCode = 409;
					break;
			}

			throw error;
		}

		res.status(200).json({
			data: publishResult.recipe,
			message: "Recipe published",
		});
	} catch (error) {
		next(error);
	}
};

const updateRecipeHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const idValidation = validateRecipeId(req.params.id);
		if (!idValidation.valid) {
			const error: CustomError = new Error(idValidation.error);
			error.statusCode = 400;
			throw error;
		}

		// Reject malformed update payload before any business logic/DB operations.
		const updatePayloadValidation = validateUpdateRecipeInput(req.body);
		if (!updatePayloadValidation.valid) {
			const error: CustomError = new Error(updatePayloadValidation.error);
			error.statusCode = 400;
			throw error;
		}

		const updateResult = await updateRecipe(
			idValidation.value,
			req.userId,
			updatePayloadValidation.value,
		);

		if (!updateResult.success) {
			const error: CustomError = new Error();

			switch (updateResult.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "forbidden":
					error.message = "No permission to update this recipe";
					error.statusCode = 403;
					break;
				case "invalid-data":
					error.message = "Invalid recipe data";
					error.statusCode = 400;
					break;
				default:
					error.message = `Recipe cannot be updated from status ${updateResult.currentStatus}`;
					error.statusCode = 409;
					break;
			}

			throw error;
		}

		res.status(200).json({
			data: updateResult.recipe,
			message: "Recipe updated",
		});
	} catch (error) {
		next(error);
	}
};

const deleteRecipeHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateRecipeId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const archiveResult = await archiveRecipe(validation.value, req.userId);

		if (!archiveResult.success) {
			const error: CustomError = new Error();

			switch (archiveResult.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "forbidden":
					error.message = "No permission to archive this recipe";
					error.statusCode = 403;
					break;
				default:
					error.message = `Recipe cannot be archived from status ${archiveResult.currentStatus}`;
					error.statusCode = 409;
					break;
			}

			throw error;
		}

		res.status(200).json({
			data: archiveResult.recipe,
			message: "Recipe archived",
		});
	} catch (error) {
		next(error);
	}
};

const favoriteRecipeHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateRecipeId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await addRecipeToFavorites(validation.value, req.userId);
		if (!result.success) {
			const error: CustomError = new Error();

			switch (result.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				default:
					error.message = "Recipe is already in favorites";
					error.statusCode = 409;
					break;
			}

			throw error;
		}

		res.status(200).json({
			data: { recipe_id: result.recipeId },
			message: "Recipe added to favorites",
		});
	} catch (error) {
		next(error);
	}
};

const unfavoriteRecipeHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			const error: CustomError = new Error("Authentication required");
			error.statusCode = 401;
			throw error;
		}

		const validation = validateRecipeId(req.params.id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await removeRecipeFromFavorites(
			validation.value,
			req.userId,
		);
		if (!result.success) {
			const error: CustomError = new Error();

			switch (result.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				default:
					error.message = "Recipe is not in favorites";
					error.statusCode = 409;
					break;
			}

			throw error;
		}

		res.status(200).json({
			data: { recipe_id: result.recipeId },
			message: "Recipe removed from favorites",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * GET /recipes - fetch all published recipes
 *
 * Note: No authentication needed - returns only published recipes
 */
const getAllRecipesHandler = async (
	_req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const recipes = await getAllRecipes();
		res.status(200).json({ data: recipes, count: recipes.length });
	} catch (error) {
		next(error);
	}
};

/**
 * GET /recipes/:id - fetch a specific recipe by id
 *
 * Errors:
 * - 400 Bad Request - if ID is not a valid positive integer
 * - 403 Forbidden - if recipe is restricted (draft of another user)
 * - 404 Not Found - if recipe doesn't exist
 */
const getRecipeByIdHandler = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const { id } = req.params;

		const validation = validateRecipeId(id);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const recipe = await getRecipeById(validation.value, req.userId);
		if (!recipe) {
			const error: CustomError = new Error("Recipe not found");
			error.statusCode = 404;
			throw error;
		}

		if ("restricted" in recipe && recipe.restricted) {
			const error: CustomError = new Error(
				"Access to this recipe is restricted",
			);
			error.statusCode = 403;
			throw error;
		}

		res.status(200).json({ data: recipe });
	} catch (error) {
		next(error);
	}
};

// extractUser middleware extracts userId from X-User-Id header

recipesRouter.post("/:id/publish", extractUser, publishRecipeHandler);

recipesRouter.post("/:id/favorite", extractUser, favoriteRecipeHandler);
recipesRouter.delete("/:id/favorite", extractUser, unfavoriteRecipeHandler);
recipesRouter.get("/:id", extractUser, getRecipeByIdHandler);
recipesRouter.put("/:id", extractUser, updateRecipeHandler);
recipesRouter.delete("/:id", extractUser, deleteRecipeHandler);

recipesRouter.get("/", getAllRecipesHandler);
recipesRouter.post("/", extractUser, createRecipeHandler);

recipesRouter.use("/:id/rating", ratingsRouter);
