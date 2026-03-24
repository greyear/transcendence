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
import mongoose from "mongoose";

// Import of project modules
//Location of userModel may or may not change later.
import { userModel } from "./auth_schema.ts";
import * as help from "./authHelpers.ts";

export const authRouter = Router();
authRouter.use(help.errorHandler);

//Connection part probably being moved later
const MONGO_AUTH_URI =
	process.env.MONGODB_AUTH_URI || "mongodb://127.0.0.1:27017/auth_db";
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
		2. Validate email address and password.
		3. If not, attempt to hash password and create new user
		4. Return relevant code
*/
authRouter.post(
	"/register",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { username, email, realname, password } = req.body;

			const userDocument = await userModel.findOne({
				$or: [{ email }, { username }],
			});

			if (userDocument)
				return res.status(409).json({ error: "Resource exists" });

			if (!help.validateEmail(req.body.email))
				return res.status(422).json({ error: "Invalid email address" });

			if (!help.validatePassword(req.body.password))
				return res.status(422).json({
					error: "The password doesn't match the password requirements",
				});

			const hashedPassword = await help.hashPassword(password);
			if (!hashedPassword)
				return res.status(500).json({ error: "Hashing failed" });

		const currentCount = await help.makeID();

		const newUser = new userModel({
										id:currentCount,
										username,
										email,
										passwordHash:hashedPassword,
										realname
										});
		await newUser.save();

			return res.status(201).json({ username, email, realname });
		} catch (error) {
			next(error);
		}
	},
);

/*
	Login with username/email and password.
		1. Check for existance. Try username and email
			findOne() because usernames/emails are unique in the DB
			Login name request can be either email or username so both fields
				need checking individually.
		2. If so, check password using bcrypt
		3. If good, create JWT and return
		4. Return relevant code
*/
authRouter.post(
	"/login",
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { username, password } = req.body;

			const userDocument = await userModel.findOne({
				$or: [{ email: username }, { username }],
			});

			if (!userDocument)
				return res.status(404).json({ error: "User not found" });

			const gotHash = userDocument.get("passwordHash");
			const passwordMatch = await help.comparePassword(password, gotHash);
			if (!passwordMatch)
				return res.status(401).json({ error: "Password mismatch" });

			const JWToken = help.generateToken(userDocument.get("_id"), username);
			return res.status(200).json({
				token: JWToken,
				message: "Login successful",
			});
		} catch (error) {
			next(error);
		}
	},
);
