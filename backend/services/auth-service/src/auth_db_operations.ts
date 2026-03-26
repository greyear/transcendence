/*
	express is our backend node.js framework
	mongoose is a mongodb convenience library for node.js
	bcrypt is our password hashing module
	jsonwebtoken is an encrypted way to pass sesson data client/server
	zod is our parsing and field validation module
 */
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

// Import of project modules
//Location of userModel may or may not change later.
import { userModel } from "./auth_schema.js";
import * as help from "./authHelpers.js";

export const authRouter = express();
// Middleware setup
authRouter.use(session({
	secret: "placeholder",
	resave: false,
	saveUninitialized: true
	})
);
authRouter.use(cookieParser());
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

			if (userDocument) {
				res.status(409).json({ error: "Resource exists" });
				return;
			}

			if (!help.validateEmail(req.body.email)) {
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
				username,
				email,
				passwordHash: hashedPassword,
				realname,
			});
			await newUser.save();

			res.status(201).json({ username, email, realname });
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

	} catch (error) {
		next(error);
	}
});

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
authRouter.post('/auth/google', async (req: Request, res: Response, next: NextFunction) =>
{
	try {
		const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
		const client = new OAuth2Client(CLIENT_ID);
		const token = help.sequenceHeader(req);
		if (!token) {
			res.status(401).json({error: 'Token not found'}); //401?
			return
		}

		const ticket = await client.verifyIdToken({
			idToken: token,
			audience: CLIENT_ID
		});
		const payload = ticket.getPayload();
		if (!payload){
			res.status(401).json({error: 'Payload not found'}); //401?
			return
		}
  		const googleID = payload.sub;
		const { email, name } = payload;

		/*
			Repetiton here, which can be sorted out later.
			Google accounts will not require a passwordHash, so just using "empty"
			Using the Google account name field as username for now.
			Not sure how correct any of this is, but making a start.
		*/
		const userDocument = await userModel.findOne({ googleID });
		if (!userDocument)
		{
			const currentCount = await help.makeID();

			const newUser = new userModel({
											id:currentCount,
											email,
											passwordHash:"empty",
											realname:name,
											googleID
											});
			await newUser.save();

			res.status(201).json({googleID, email, name});
			return
		}
		else
		{
			const JWToken = help.generateToken(userDocument.get('_id'), googleID);

			req.session.user = googleID;
			console.log(req.session.user);
			console.log(req.sessionID);
			res.cookie("sessionId", req.sessionID);
			console.log(res.cookie);
			res.cookie("JWToken", JWToken);
			console.log(res.cookie);
			res.status(200).json({ 
						token: JWToken,
						message: "Login successful"
			});
			return
		}

	} catch (error) {
		next(error);
	}
});
