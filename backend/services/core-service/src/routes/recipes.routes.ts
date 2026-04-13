/**
 * Recipes Routes
 *
 * 2-layer structure:
 * - Routes: HTTP handling + validation + response formatting
 * - Services: business logic + database access
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import multer from "multer";
import { pool } from "../db/database.js";
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
	getRecipeReviews,
	leaveRecipeReview,
	publishRecipe,
	removeRecipeFromFavorites,
	updateRecipe,
	updateRecipePicture,
} from "../services/recipes.service.js";
import {
	resolveRequestedLocale,
	resolveSourceLocale,
} from "../utils/locale.js";
import {
	validateCreateRecipeInput,
	validateCreateRecipeReviewInput,
	validateRecipeId,
	validateUpdateRecipeInput,
} from "../validation/schemas.js";
import { ratingsRouter } from "./ratings.routes.js";

interface CustomError extends Error {
	statusCode?: number;
}

const RECIPE_PICTURES_DIR = path.resolve("uploads/recipes");
const MAX_PICTURE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PICTURE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const recipePictureStorage = multer.diskStorage({
	destination: (
		_req: Request,
		_file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void,
	) => {
		cb(null, RECIPE_PICTURES_DIR);
	},
	filename: (
		req: AuthenticatedRequest,
		_file: Express.Multer.File,
		cb: (error: Error | null, filename: string) => void,
	) => {
		const ext =
			_file.mimetype === "image/png"
				? "png"
				: _file.mimetype === "image/webp"
					? "webp"
					: "jpg";
		const suffix = crypto.randomBytes(8).toString("hex");
		cb(null, `${req.params.id}_${suffix}.${ext}`);
	},
});

const recipePictureUpload = multer({
	storage: recipePictureStorage,
	limits: { fileSize: MAX_PICTURE_SIZE_BYTES },
	fileFilter: (
		_req: Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback,
	) => {
		if (ALLOWED_PICTURE_MIME_TYPES.includes(file.mimetype)) {
			cb(null, true);
		} else {
			const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
			err.message = "Only JPEG, PNG and WebP images are allowed";
			cb(err);
		}
	},
});

const handleRecipePictureMulterError = (
	err: unknown,
	_req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (err instanceof multer.MulterError) {
		res.status(400).json({ error: err.message });
		return;
	}
	next(err);
};

// middleware for oicture upload to protect from malicious actions
const preCheckRecipePictureOwnership = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		if (req.userId === undefined) {
			res.status(401).json({ error: "Authentication required" });
			return;
		}

		const idValidation = validateRecipeId(req.params.id);
		if (!idValidation.valid) {
			res.status(400).json({ error: idValidation.error });
			return;
		}

		const result = await pool.query(
			`SELECT author_id, status FROM recipes WHERE id = $1`,
			[idValidation.value],
		);

		if (result.rowCount === 0) {
			res.status(404).json({ error: "Recipe not found" });
			return;
		}

		const { author_id, status } = result.rows[0];

		if (author_id !== req.userId) {
			res.status(403).json({ error: "No permission to update this recipe" });
			return;
		}

		if (status !== "draft" && status !== "published") {
			res.status(409).json({
				error: `Recipe picture cannot be updated from status ${status}`,
			});
			return;
		}

		next();
	} catch (error) {
		next(error);
	}
};

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

		const locale = resolveRequestedLocale(req);
		const sourceLocale = resolveSourceLocale(req);
		const recipe = await createRecipe(
			req.userId,
			validation.value,
			locale,
			sourceLocale,
		);
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

		const locale = resolveRequestedLocale(req);
		const publishResult = await publishRecipe(
			validation.value,
			req.userId,
			locale,
		);

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

		const locale = resolveRequestedLocale(req);
		const sourceLocale = resolveSourceLocale(req);
		const updateResult = await updateRecipe(
			idValidation.value,
			req.userId,
			updatePayloadValidation.value,
			locale,
			sourceLocale,
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

		const locale = resolveRequestedLocale(req);
		const archiveResult = await archiveRecipe(
			validation.value,
			req.userId,
			locale,
		);

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
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const locale = resolveRequestedLocale(req);
		const recipes = await getAllRecipes(locale);
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

		const locale = resolveRequestedLocale(req);
		const recipe = await getRecipeById(validation.value, req.userId, locale);
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

const updateRecipePictureHandler = async (
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

		const multerReq = req as AuthenticatedRequest & {
			file?: Express.Multer.File;
		};
		if (!multerReq.file) {
			const error: CustomError = new Error("Picture file is required");
			error.statusCode = 400;
			throw error;
		}

		const pictureUrl = `/recipe-pictures/${multerReq.file.filename}`;

		const result = await updateRecipePicture(
			idValidation.value,
			req.userId,
			pictureUrl,
		);

		if (!result.success) {
			const error: CustomError = new Error();
			switch (result.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "forbidden":
					error.message = "No permission to update this recipe";
					error.statusCode = 403;
					break;
				case "invalid-status":
					error.message = `Recipe picture cannot be updated from status ${result.currentStatus}`;
					error.statusCode = 409;
					break;
			}
			throw error;
		}

		res.status(200).json({
			data: { picture_url: pictureUrl },
			message: "Recipe picture updated",
		});
	} catch (error) {
		// Clean up uploaded file if update failed
		const multerReq = req as AuthenticatedRequest & {
			file?: Express.Multer.File;
		};
		if (multerReq.file) {
			fs.unlink(multerReq.file.path, (err) => {
				if (err)
					console.error("Failed to delete orphaned recipe picture:", err);
			});
		}
		next(error);
	}
};

const leaveRecipeReviewHandler = async (
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

		const bodyValidation = validateCreateRecipeReviewInput(req.body);
		if (!bodyValidation.valid) {
			const error: CustomError = new Error(bodyValidation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await leaveRecipeReview(
			idValidation.value,
			req.userId,
			bodyValidation.value,
		);

		if (!result.success) {
			const error: CustomError = new Error();

			switch (result.reason) {
				case "unauthorized":
					error.message = "Authentication required";
					error.statusCode = 401;
					break;
				default:
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
			}

			throw error;
		}

		res.status(201).json({
			data: { recipe_id: idValidation.value, review_id: result.reviewId },
			message: "Review published",
		});
	} catch (error) {
		next(error);
	}
};

const getRecipeReviewsHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const idValidation = validateRecipeId(req.params.id);
		if (!idValidation.valid) {
			const error: CustomError = new Error(idValidation.error);
			error.statusCode = 400;
			throw error;
		}

		const reviews = await getRecipeReviews(idValidation.value);
		if (!reviews) {
			const error: CustomError = new Error("Recipe not found");
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ data: reviews, count: reviews.length });
	} catch (error) {
		next(error);
	}
};

// extractUser middleware extracts userId from X-User-Id header

recipesRouter.post("/:id/publish", extractUser, publishRecipeHandler);

recipesRouter.post("/:id/favorite", extractUser, favoriteRecipeHandler);
recipesRouter.delete("/:id/favorite", extractUser, unfavoriteRecipeHandler);
recipesRouter.put(
	"/:id/picture",
	extractUser,
	preCheckRecipePictureOwnership,
	recipePictureUpload.single("picture"),
	handleRecipePictureMulterError,
	updateRecipePictureHandler,
);

recipesRouter.post("/:id/reviews", extractUser, leaveRecipeReviewHandler);
recipesRouter.get("/:id/reviews", getRecipeReviewsHandler);
recipesRouter.get("/:id", extractUser, getRecipeByIdHandler);
recipesRouter.put("/:id", extractUser, updateRecipeHandler);
recipesRouter.delete("/:id", extractUser, deleteRecipeHandler);

recipesRouter.get("/", getAllRecipesHandler);
recipesRouter.post("/", extractUser, createRecipeHandler);

recipesRouter.use("/:id/rating", ratingsRouter);
