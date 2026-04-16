import bcrypt from "bcrypt";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import z from "zod";

import { userCounter } from "./auth_schema.js";

export const jwtPayloadSchema = z.object({
	sub: z.string(),
	userId: z.number(),
	email: z.string(),
	type: z.string(),
});
export type AppJwtPayload = z.infer<typeof jwtPayloadSchema>;

// Adding a custom field to the req to store decoded JWT
declare global {
	namespace Express {
		interface Request {
			decodedJWT?: AppJwtPayload;
		}
	}
}

//From auth_db_operations.ts
//
// Password hashing, using bcrypt. I think slightly simpler than others.
//Concern with security of the salt.
//Maybe change to argon2
export const hashPassword = async (password: string) => {
	const saltCost = 12;

	try {
		const salt = await bcrypt.genSalt(saltCost);
		const hash = await bcrypt.hash(password, salt);
		return hash;
	} catch (error) {
		console.error(error);
	}
	return null;
};

// Password hash check.
export const comparePassword = async (password: string, hash: string) => {
	try {
		const isMatch = await bcrypt.compare(password, hash);
		return isMatch;
	} catch (error) {
		console.error(error);
	}
	return false;
};

//Validate email using Zod library
//This is not much different to the example they give on their basic manual
//https://zod.dev/basics
export const validateEmail = (email: string) => {
	const emailPattern = z.email();
	const result = emailPattern.safeParse(email);
	return result.success;
};

/*
	Validate password using Zod library
	https://zod.dev/basics
	Password rules: 8 chars min, 64 max, 1 each of upper, lower and special
	The refinement is looking for at least one in the test string.
	[^A-Za-z0-9] means ANYTHING that is not in the given character ranges.
	Zod has a .regex() method, but it didn't seem to work for me.
*/
export const validatePassword = (password: string) => {
	const passwordPattern = z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(64, "Password must be at most 64 characters")
		.refine(
			(password) => /[A-Z]/.test(password),
			"Must include 1 uppercase letter",
		)
		.refine(
			(password) => /[a-z]/.test(password),
			"Must include 1 lowercase letter",
		)
		.refine((password) => /[0-9]/.test(password), "Must include 1 number")
		.refine(
			(password) => /[^A-Za-z0-9]/.test(password),
			"Must include 1 special character",
		);

	const result = passwordPattern.safeParse(password);
	return result.success;
};

// Call this function after authentication success.
// id is from userDocument.id and is number type
export const generateToken = (
	id: string,
	userId: number,
	email: string,
	type: string,
) => {
	const JWTSecret = process.env.JWT_SECRET;
	if (!JWTSecret) {
		throw new Error("JWTSecret env variable is not set");
	}

	const payload = {
		sub: id,
		userId,
		email,
		type,
	};

	return jwt.sign(payload, JWTSecret, {
		algorithm: "HS256",
		expiresIn: "1h",
	});
};

//Decode the given JWT and return its origin JSON
export const decodeToken = (token: string) => {
	try {
		const JWTSecret = process.env.JWT_SECRET;
		if (!JWTSecret) {
			throw new Error("JWTSecret env variable is not set");
		}

		const decoded = jwt.verify(token, JWTSecret);

		return decoded;
	} catch (error) {
		console.error(error);
		return null;
	}
};

//Isolate and return the token part of req.headers.authorization.
//Format: Bearer <token>
export const sequenceHeader = (req: Request) => {
	try {
		const authHeaders = req.headers.authorization;
		if (!authHeaders) return null;

		const testToken = authHeaders.split(" ");
		return testToken[1];
	} catch (error) {
		console.error(error);
		return null;
	}
};

//Take req.headers.authorization and output a decoded JWT if possible
//Uses decodeToken() and sequenceHeader()
export const fetchDecodeToken = (req: Request): AppJwtPayload | null => {
	try {
		const tokenHeader = sequenceHeader(req);
		if (!tokenHeader) {
			throw Error("Given header does not contain a parseable token");
		}
		const decoded = decodeToken(tokenHeader);
		if (!decoded) {
			throw Error("Whatever was given was not a token");
		}
		const parsed = jwtPayloadSchema.safeParse(decoded);
		if (!parsed.success) {
			throw Error("Token payload does not match expected shape");
		}
		return parsed.data;
	} catch (error) {
		console.error(error);
		return null;
	}
};

// Simple helper to validate JWT and check email
export const compareJWT = (req: Request, res: Response, next: NextFunction) => {
	const decodedJWT = fetchDecodeToken(req);
	if (!decodedJWT) {
		res.status(401).json({ error: "Invalid token" });
		return;
	}
	if (decodedJWT.userId !== parseInt(req.body.userId, 10)) {
		res.status(401).json({ error: "Incorrect token" });
		return;
	}

	req.decodedJWT = decodedJWT;
	next();
};

// Create a sequential and unique userID.
// We keep auth user IDs above seeded core IDs to avoid collisions with demo data.
const MIN_AUTH_USER_ID = 100000;

export const makeID = async (): Promise<number> => {
	const counter = await userCounter.findOne({ name: "CounterDB" });

	if (!counter) {
		await userCounter.create({ name: "CounterDB", seq: MIN_AUTH_USER_ID });
		return MIN_AUTH_USER_ID;
	}

	if (counter.seq < MIN_AUTH_USER_ID) {
		counter.seq = MIN_AUTH_USER_ID;
		await counter.save();
		return MIN_AUTH_USER_ID;
	}

	const updatedCounter = await userCounter.findOneAndUpdate(
		{ name: "CounterDB" },
		{ $inc: { seq: 1 } },
		{ new: false },
	);

	return updatedCounter ? updatedCounter.seq : MIN_AUTH_USER_ID;
};

// Error handling middleware
export const errorHandler = (
	error: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	console.error(error);
	const message =
		error instanceof Error ? error.message : "Internal Server Error";
	res.status(500).json({ error: message });
};
