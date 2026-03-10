import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import z from "zod";

//Location of userModel may or may not change later.
import { userModel } from './auth_schema.ts'; 

//From auth_db_operations.ts
//
// Password hashing, using bcrypt. I think slightly simpler than others.
//Concern with security of the salt.
//Maybe change to argon2
export const hashPassword = async (password) =>
{
	const saltCost = 5;

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
export const comparePassword = async (password, hash) =>
{
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
export const validateEmail = (email) =>
{
	const emailPattern = z.email();
	const result = emailPattern.safeParse(email);
	return result.success
};

/*
	Validate password using Zod library
	https://zod.dev/basics
	Password rules: 8 chars min, 1 each of upper, lower and special
	The refinement is looking for at least one in the test string.
	[^A-Za-z0-9] means ANYTHING that is not in the given character ranges.
	Zod has a .regex() method, but it didn't seem to work for me.
*/
export const validatePassword = (password) =>
{
	const passwordPattern = z.string().min(8, "Password must be at least 8 characters")
		.refine((password) => /[A-Z]/.test(password), "Must include 1 uppercase letter")
		.refine((password) => /[a-z]/.test(password), "Must include 1 lowercase letter")
		.refine((password) => /[0-9]/.test(password), "Must include 1 number")
		.refine((password) => /[^A-Za-z0-9]/.test(password), "Must include 1 special character");

	const result = passwordPattern.safeParse(password);
	return result.success
};

// Call this function after authentication success.
// id is from userDocument._id and is ObjectId type
export const generateToken = (id, username) =>
{
	const JWTSecret = process.env.JWTSecret || "placeholder";

	const payload = {
		sub: id,
		username,
	};

	return jwt.sign(payload, JWTSecret, {
		algorithm: "HS256", expiresIn: "1h"
	});
};


export const decodeToken = (token) =>
{
	try {
		const JWTSecret = process.env.JWTSecret || "placeholder";

		const decoded = jwt.verify(token, JWTSecret);

		return decoded;
	} catch (error) {
		console.error(error);
		return null;
	}
};

export const sequenceHeader = (req) =>
{
	try {
		const authHeaders = req.headers.authorization;
		if (!authHeaders)
			return null;

		const testToken = authHeaders.split(" ");
		return testToken[1];

	} catch (error) {
		console.error(error);
		return null;
	}
};

export const fetchDecodeToken = (req) =>
{
	try {
		const tokenHeader = sequenceHeader(req);
		if (!tokenHeader)
			throw Error("Given header does not contain a parseable token");

		const decodedToken = decodeToken(tokenHeader);
		if (!decodedToken)
			throw Error("Whatever was given was not a token");

		return decodedToken;
	} catch (error) {
		console.error(error);
		return null;
	}
};

// Simple helper to validate JWT and check username
export const compareJWT = (req, res, next) =>
{
	const decodedJWT = fetchDecodeToken(req);
	if (!decodedJWT)
		return res.status(401).json({ error: "Invalid token" });
	if (decodedJWT.username !== req.params.username)
		return res.status(401).json({ error: "Incorrect token" });

	next();
}
