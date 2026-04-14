/*
	express is our backend node.js framework
	mongoose is a mongodb convenience library for node.js
	bcrypt is our password hashing module
	jsonwebtoken is an encrypted way to pass sesson data client/server
	zod is our parsing and field validation module
 */

import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";
import z from "zod";

// Import of project modules
//Location of userModel may or may not change later.
import { userModel } from "./auth_schema.js";
import * as help from "./authHelpers.js";

export const authRouter = Router();

const loginResponseSchema = z.object({
	token: z.string(),
	message: z.string(),
});
const mongoErrorSchema = z.object({ code: z.literal(11000) });

const AUTH_SERVICE_URL =
	process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

// Connection part
// Fetch env or throw.
const MONGO_AUTH_URI = process.env.MONGODB_URI || process.env.MONGODB_AUTH_URI;
if (!MONGO_AUTH_URI) {
	throw new Error("MONGODB_URI or MONGODB_AUTH_URI env variable is not set");
}

// Connect to MongoDB
// https://mongoosejs.com/docs/connections.html
mongoose
	.connect(MONGO_AUTH_URI)
	.then(() => {
		console.log("Connected to MongoDB");
		// Start the server after the database connection is established
	})
	.catch((err) => {
		console.error("Error connecting to MongoDB:", err);
		process.exit(1);
	});

/*
	Create user if user does not exist.
		1. Check for existance. Try username and email
			findOne() because usernames/emails are unique in the DB
			Login name request can be either email or username so both fields
				need checking individually.
		2. If user exists check for Google-only account and return relevant message
		3. If not, attempt to validate email, username and password format
		4. Attempt to create user in DB
		5. Return relevant code
*/
authRouter.post(
	"/register",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password } = req.body;

			const userDocument = await userModel.findOne({ email });

			if (userDocument) {
				// Check if it's a Google-only account
				if (userDocument.get("googleID")) {
					res.status(409).json({
						error:
							"Email already registered with Google Sign-In. Please use Google login.",
					});
					return;
				}
				res.status(409).json({ error: "Resource exists" });
				return;
			}

			if (!help.validateEmail(email)) {
				res.status(422).json({ error: "Invalid email address" });
				return;
			}

			if (!help.validatePassword(req.body.password)) {
				res.status(422).json({
					error: "The password doesn't match the password requirements",
				});
				return;
			}

			const hashedPassword = await help.hashPassword(password);
			if (!hashedPassword) {
				res.status(500).json({ error: "Hashing failed" });
				return;
			}

			const currentCount = await help.makeID();

			const newUser = new userModel({
				id: currentCount,
				email,
				passwordHash: hashedPassword,
			});
			await newUser.save();

			const loginRes = await fetch(`${AUTH_SERVICE_URL}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(req.body),
			});

			const loginParsed = loginResponseSchema.safeParse(await loginRes.json());
			const loginPayload = loginParsed.success ? loginParsed.data : {};

			const setCookie = loginRes.headers.get("set-cookie");
			if (setCookie) {
				res.set("Set-Cookie", setCookie);
			}
			res.status(201).json({ email, id: currentCount, loginPayload });

		} catch (error) {
			if (mongoErrorSchema.safeParse(error).success) {
				res.status(409).json({ error: "Email or username already exists" });
			} else {
				next(error);
			}
		}
	},
);

/*
	Login with username/email and password.
		1. Check for existance. Try username and email
			findOne() because usernames/emails are unique in the DB
			Login name request can be either email or username so both fields
				need checking individually.
		2. If user exists check for Google-only account and return relevant message
		3. If so, check password using bcrypt
		4. If good, create JWT and return
		5. Return relevant code
*/
authRouter.post(
	"/login",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { username, password } = req.body; //left as username to reduce work

			const userDocument = await userModel.findOne({ email: username });

			if (!userDocument) {
				res.status(404).json({ error: "User not found" });
				return;
			}

			// Check if user is a Google-only account
			const googleID = userDocument.get("googleID");
			if (googleID) {
				res.status(401).json({
					error:
						"This account uses Google Sign-In only. Please use the Google login option.",
				});
				return;
			}

			const gotHash = userDocument.get("passwordHash");
			const passwordMatch = await help.comparePassword(password, gotHash);
			if (!passwordMatch) {
				res.status(401).json({ error: "Password mismatch" });
				return;
			}

			// Send success response
			//https://howhttpworks.com/guides/cookie-security
			//https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1
			//secure = lax seems fine for our use case.
			const usernameResult = z.string().safeParse(userDocument.get("username"));
			if (!usernameResult.success) {
				res.status(500).json({ error: "Invalid username in database" });
				return;
			}
			const JWToken = help.generateToken(
				userDocument.get("_id"),
				userDocument.get("id"),
				usernameResult.data,
				"mongo",
			);

			res.cookie("token", JWToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 60 * 60 * 1000, //1 hour in ms
			});
			res.status(200).json({
				token: JWToken,
				message: "Login successful",
			});
		} catch (error) {
			next(error);
		}
	},
);

/*
	Login/register with Google account.
		1. Verify token using google-auth-library method verifyIdToken()
			Failed verification should throw.
			Assuming token is being sent in the authorisation header, for now.
		2. Check for existance. Assuming I only need to check googleID.
			findOne() because googleIDs are unique in the DB
		3. Either create a new account, or login with existing account.
	https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
	https://www.w3tutorials.net/blog/google-sign-in-backend-verification/
*/
authRouter.post(
	"/google",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
			if (!CLIENT_ID) {
				throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
			}

			const client = new OAuth2Client(CLIENT_ID);
			const token = help.sequenceHeader(req);
			if (!token) {
				res.status(401).json({ error: "Token not found" }); //401?
				return;
			}

			const ticket = await client.verifyIdToken({
				idToken: token,
				audience: CLIENT_ID,
			});
			const payload = ticket.getPayload();
			if (!payload) {
				res.status(401).json({ error: "Payload not found" }); //401?
				return;
			}
			const googleID = payload.sub;
			const { email, name } = payload;

			// Check if email already exists as normal account
			const existingEmailUser = await userModel.findOne({ email });
			if (existingEmailUser && !existingEmailUser.get("googleID")) {
				res.status(409).json({
					error:
						"Email already registered with password login. Please use normal login instead.",
				});
				return;
			}

			//Repetiton here, which can be sorted out later.
			//Google accounts will not require a passwordHash, so just using "empty"
			const userDocument = await userModel.findOne({ googleID });
			if (!userDocument) {
				const currentCount = await help.makeID();

				const newUser = new userModel({
					id: currentCount,
					email,
					passwordHash: "empty",
					googleID,
				});
				await newUser.save();
				
				const loginRes = await fetch(`${AUTH_SERVICE_URL}/google`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				});
				const loginParsed = loginResponseSchema.safeParse(await loginRes.json());
				const loginPayload = loginParsed.success ? loginParsed.data : {};
				const setCookie = loginRes.headers.get("set-cookie");
				if (setCookie) {
					res.set("Set-Cookie", setCookie);
				}

				res.status(201).json({ googleID, email, name, id: currentCount, loginPayload });
			} else {
				const JWToken = help.generateToken(
					userDocument.get("_id"),
					userDocument.get("id"),
					googleID,
					"google",
				);

				res.cookie("token", JWToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "lax",
					maxAge: 60 * 60 * 1000,
				});
				res.status(200).json({
					token: JWToken,
					message: "Login successful",
				});
				return;
			}
		} catch (error) {
			if (mongoErrorSchema.safeParse(error).success) {
				res.status(409).json({ error: "Email or googleID already exists" });
			} else {
				next(error);
			}
		}
	},
);
