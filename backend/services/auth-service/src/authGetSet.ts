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

const CORE_SERVICE_URL =
	process.env.CORE_SERVICE_URL || "http://core-service:3002";

/*
	Delete user endpoint
		1. Attempt to validate JWT from header
		2. Decode which account identity belongs to
		3. findOneAndDelete() to remove matching record
		4. Return relevant code
	As of now does not require the current password.
	https://developers.google.com/identity/openid-connect/reference
*/
authGetSet.delete(
	"/delete",
	help.compareJWT,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { userId } = req.body;

			const userDocument = await userModel.findOneAndDelete({ id: userId });

			if (!userDocument) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			try {
				const fetchRes = await fetch(`${CORE_SERVICE_URL}/profile/delete`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id: userId }),
				});
				if (!fetchRes.ok) {
					console.error(
						`Core delete of user ${userId} failed with status ${fetchRes.status}`,
					);
				}
			} catch (error) {
				console.error(
					`Failed to delete core profile for user ${userId}:`,
					error,
				);
			}

			res.json({ message: "User deleted" });
		} catch (error) {
			next(error);
		}
	},
);

/*
	Change user password endpoint
		1. Attempt to validate JWT from header
		2. Attempt to validate new password format
		3. Attempt to validate old password
		4. Attempt to hash new password
		5. findOneAndUpdate() to update the record with new hash
			Find by URI param. Recreate record with new data
		6. Return relevant code
*/
authGetSet.patch(
	"/change-password",
	help.compareJWT,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { newPassword, password } = req.body;
			const userId = parseInt(req.body.userId, 10);

			if (!help.validatePassword(newPassword)) {
				res.status(422).json({
					error: "The password doesn't match the password requirements",
				});
				return;
			}

			const userDocument = await userModel.findOne({ id: userId });
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
				{ id: userId },
				{ passwordHash: hashedPassword },
				{ returnDocument: "after" },
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

// /validate endpoint to specifically validate a JWT within the header.
// Checks against username or email. Content with this as both are unique.
// References to username here are remnants of a prior version
authGetSet.post(
	"/validate",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const decodedToken = help.fetchDecodeToken(req);
			if (!decodedToken) {
				res.status(401).json({ error: "Invalid token" });
				return;
			}

			const searchId = decodedToken.email;
			const type = decodedToken.type;

			let userDocument = null;
			if (type === "mongo") {
				userDocument = await userModel.findOne({ email: searchId });
			} else if (type === "google") {
				userDocument = await userModel.findOne({ email: searchId });
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

/*
	Session status endpoint
		1. Attempt to decode JWT from cookie or Authorization header
		2. If valid token → return { authenticated: true }
		3. If missing or invalid token → return { authenticated: false }
	Always returns 200 — safe to call for guests.
*/
authGetSet.get("/session", (req: Request, res: Response) => {
	const decodedToken = help.fetchDecodeToken(req);
	if (!decodedToken) {
		res.status(200).json({ authenticated: false });
		return;
	}
	res.status(200).json({ authenticated: true });
});

/*
	Fetch user details endpoint
		1. Validate JWT from header
		2. Look up user in DB by userId
		3. Return id and email
	Probably better to combine the /validate result into here.
*/
authGetSet.get(
	"/me",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const decodedToken = help.fetchDecodeToken(req);
			if (!decodedToken) {
				res.status(401).json({ error: "Invalid token" });
				return;
			}

			const { userId } = decodedToken;
			const userDocument = await userModel.findOne({ id: userId });
			if (!userDocument) {
				res.status(404).json({ error: "User not found" });
				return;
			}
			const email = userDocument.get("email");
			const isGoog = userDocument.get("googleID") ? true : false;

			res.status(200).json({ id: userId, email, isGoog });
		} catch (error) {
			next(error);
		}
	},
);
