/**
 * Recipe Ratings Routes (Core Service)
 *
 * 2-layer structure:
 * - Routes: HTTP handling + validation + response formatting
 * - Services: business logic + database access
 *
 * POST   /recipes/:id/rating  – rate a recipe
 * PUT    /recipes/:id/rating  – update rating
 * DELETE /recipes/:id/rating  – remove rating
 */

import { type NextFunction, type Response, Router } from "express";
import {
	type AuthenticatedRequest,
	extractUser,
} from "../middleware/extractUser.js";
import {
	createRating,
	deleteRating,
	updateRating,
} from "../services/ratings.service.js";
import {
	validateRatingInput,
	validateRecipeId,
} from "../validation/schemas.js";

interface CustomError extends Error {
	statusCode?: number;
}

export const ratingsRouter = Router({ mergeParams: true });

// ── POST /recipes/:id/rating ──────────────────────────────────────────────────

const createRatingHandler = async (
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

		const ratingValidation = validateRatingInput(req.body);
		if (!ratingValidation.valid) {
			const error: CustomError = new Error(ratingValidation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await createRating(
			idValidation.value,
			req.userId,
			ratingValidation.value.rating,
		);

		if (!result.success) {
			const error: CustomError = new Error();
			switch (result.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "conflict":
					error.message = "You have already rated this recipe";
					error.statusCode = 409;
					break;
			}
			throw error;
		}

		res.status(201).json({ message: "Rating created" });
	} catch (error) {
		next(error);
	}
};

// ── PUT /recipes/:id/rating ───────────────────────────────────────────────────

const updateRatingHandler = async (
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

		const ratingValidation = validateRatingInput(req.body);
		if (!ratingValidation.valid) {
			const error: CustomError = new Error(ratingValidation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await updateRating(
			idValidation.value,
			req.userId,
			ratingValidation.value.rating,
		);

		if (!result.success) {
			const error: CustomError = new Error();
			switch (result.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "not-rated":
					error.message = "You have not rated this recipe";
					error.statusCode = 404;
					break;
			}
			throw error;
		}

		res.status(200).json({ message: "Rating updated" });
	} catch (error) {
		next(error);
	}
};

// ── DELETE /recipes/:id/rating ────────────────────────────────────────────────

const deleteRatingHandler = async (
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

		const result = await deleteRating(idValidation.value, req.userId);

		if (!result.success) {
			const error: CustomError = new Error();
			switch (result.reason) {
				case "not-found":
					error.message = "Recipe not found";
					error.statusCode = 404;
					break;
				case "not-rated":
					error.message = "You have not rated this recipe";
					error.statusCode = 404;
					break;
			}
			throw error;
		}

		res.status(200).json({ message: "Rating deleted" });
	} catch (error) {
		next(error);
	}
};

// ── Route registration ────────────────────────────────────────────────────────

ratingsRouter.post("/", createRatingHandler);
ratingsRouter.put("/", updateRatingHandler);
ratingsRouter.delete("/", deleteRatingHandler);
