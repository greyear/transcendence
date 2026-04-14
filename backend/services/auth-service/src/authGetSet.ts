import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
// Import of project modules
//Location of userModel may or may not change later.
import { userModel } from "./auth_schema.js";
import * as help from "./authHelpers.js";

export const authGetSet = Router();

/*
	Delete user. /users/:username endpoint
		1. Attempt to validate JWT from header
		1. findOneAndDelete() to remove matching record
		2. Return relevant code
	As of now does not require the current password.
	https://developers.google.com/identity/openid-connect/reference
*/
authGetSet.delete(
	"/delete/:username",
	help.compareJWT,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const username = req.params.username;

			let userDocument = null;
			if (req.decodedJWT?.type === "mongo") {
				userDocument = await userModel.findOneAndDelete({ username });
			} else if (req.decodedJWT?.type === "google") {
				userDocument = await userModel.findOneAndDelete({ googleID: username });
			}

			if (!userDocument) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			res.json({ message: "User deleted" });
		} catch (error) {
			next(error);
		}
	},
);

/*
	Change user password. /users/:username endpoint
		1. Attempt to validate JWT from header
		2. Attempt to validate new password format
		3. Attempt to validate old password
		4. Attempt to hash new password
		5. findOneAndUpdate() to update the record with new hash
			Find by URI param. Recreate record with new data
		6. Return relevant code
*/
authGetSet.patch(
	"/change-password/:username",
	help.compareJWT,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { newPassword, password } = req.body;
			const username = req.params.username;

			if (!help.validatePassword(newPassword)) {
				res.status(422).json({
					error: "The password doesn't match the password requirements",
				});
				return;
			}

			const userDocument = await userModel.findOne({ username });
			if (!userDocument) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			const gotHash = userDocument.get("passwordHash");
			const passwordMatch = await help.comparePassword(password, gotHash);
			if (!passwordMatch) {
				res.status(401).json({ error: "Password mismatch" });
				return;
			}

			const hashedPassword = await help.hashPassword(newPassword);
			if (!hashedPassword) {
				res.status(500).json({ error: "Hashing failed" });
				return;
			}

			const updatedUser = await userModel.findOneAndUpdate(
				{ username },
				{ passwordHash: hashedPassword },
				{ new: true },
			);

			if (updatedUser) {
				res.json({ message: "Password updated successfully" });
				return;
			}

			res.status(404).json({ error: "User not found" });
		} catch (error) {
			next(error);
		}
	},
);

// /auth/validate endpoint to specifically validate a JWT within the header.
// Checks against username or email. Content with this as both are unique.
authGetSet.post(
	"/validate",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const decodedToken = help.fetchDecodeToken(req);
			if (!decodedToken) {
				res.status(401).json({ error: "Invalid token" });
				return;
			}

			const searchId = decodedToken.username;
			const type = decodedToken.type;

			let userDocument = null;
			if (type === "mongo") {
				userDocument = await userModel.findOne({
					$or: [{ username: searchId }, { email: searchId }],
				});
			} else if (type === "google") {
				userDocument = await userModel.findOne({ googleID: searchId });
			}

			if (!userDocument) {
				res.status(401).json({ error: "Invalid token" });
				return;
			}

			const userID = userDocument.get("id");
			if (!userID) {
				res.status(500).json({ error: "User has no id" });
				return;
			}

			res.status(200).json({ id: userID });
		} catch (error) {
			next(error);
		}
	},
);
