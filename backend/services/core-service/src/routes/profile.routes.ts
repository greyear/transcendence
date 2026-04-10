/**
 * Profile Routes (Core Service)
 *
 * 2-layer structure:
 * - Routes: HTTP handling + validation + response formatting
 * - Services: business logic + database access
 *
 * GET /profile  – get authenticated user's profile (id, username, avatar)
 * PUT /profile  – update username and/or avatar (multipart/form-data)
 *
 * Avatar files are stored in /uploads/avatars/ inside the project.
 * The avatar column in the DB stores the public URL path (e.g. /avatars/42.jpg).
 */

import path from "node:path";
import fs from "node:fs";
import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import multer from "multer";
import {
	type AuthenticatedRequest,
	extractUser,
} from "../middleware/extractUser.js";
import { getProfile, updateProfile } from "../services/profile.service.js";
import { validateUpdateProfileInput } from "../validation/schemas.js";

interface CustomError extends Error {
	statusCode?: number;
}

export const profileRouter = Router();

// ── Multer setup ──────────────────────────────────────────────────────────────

const AVATARS_DIR = path.resolve("uploads/avatars");
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const avatarStorage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, AVATARS_DIR);
	},
	filename: (req: AuthenticatedRequest, _file, cb) => {
		// Use userId as filename to automatically overwrite old avatar
		const ext =
			_file.mimetype === "image/png"
				? "png"
				: _file.mimetype === "image/webp"
					? "webp"
					: "jpg";
		cb(null, `${req.userId}.${ext}`);
	},
});

const avatarUpload = multer({
	storage: avatarStorage,
	limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
	fileFilter: (_req, file, cb) => {
		if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
			cb(null, true);
		} else {
			const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
			err.message = "Only JPEG, PNG and WebP images are allowed";
			cb(err);
		}
	},
});

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * Multer error handler
 */
const handleMulterError = (
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

/**
 * GET /profile  – get authenticated user's profile (id, username, avatar)
 */
const getProfileHandler = async (
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

		const profile = await getProfile(req.userId);
		if (!profile) {
			const error: CustomError = new Error("User not found");
			error.statusCode = 404;
			throw error;
		}

		res.status(200).json({ data: profile });
	} catch (error) {
		next(error);
	}
};

/**
 * PUT /profile  – update username and/or avatar (multipart/form-data)
 */
const updateProfileHandler = async (
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

		// If a file was uploaded, build the public avatar URL from the saved filename
		const avatarUrl = req.file ? `/avatars/${req.file.filename}` : undefined;

		// Merge text fields from body with avatar URL if present
		const rawInput = {
			...req.body,
			...(avatarUrl !== undefined && { avatar: avatarUrl }),
		};

		const validation = validateUpdateProfileInput(rawInput);
		if (!validation.valid) {
			const error: CustomError = new Error(validation.error);
			error.statusCode = 400;
			throw error;
		}

		const result = await updateProfile(req.userId, validation.value);

		if (!result.success) {
			const error: CustomError = new Error();
			switch (result.reason) {
				case "not-found":
					error.message = "User not found";
					error.statusCode = 404;
					break;
				case "username-taken":
					error.message = "Username is already taken";
					error.statusCode = 409;
					break;
			}
			throw error;
		}

		res.status(200).json({ data: result.profile, message: "Profile updated" });
	} catch (error) {
		// Clean up uploaded file if the update failed
		if (req.file) {
			fs.unlink(req.file.path, (err) => {
				if (err) console.error("Failed to delete orphaned avatar:", err);
			});
		}
		next(error);
	}
};

// ── Route registration ────────────────────────────────────────────────────────

profileRouter.get("/", extractUser, getProfileHandler);

// avatarUpload.single("avatar") processes the multipart field named "avatar"
// It runs before the handler, so req.file is available if a file was uploaded
profileRouter.put(
	"/",
	extractUser,
	avatarUpload.single("avatar"),
	handleMulterError,
	updateProfileHandler,
);
