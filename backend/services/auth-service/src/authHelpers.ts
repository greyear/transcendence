import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import z from "zod";

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

/*
	Validate/verify a JWT. /auth/validate endpoint
	When passed a request with an "Authorization" header, attempts to
	validate any attached token. Missing header returns 422 (Unprocessable Entity)
	Authorization header is formatted thus: <type> <token> so needs splitting.
*/
export const validateJWT = (req) =>
{
	try {
		const authHeaders = req.headers.authorization;
		if (!authHeaders)
			return null;

		const testToken = authHeaders.split(" ");
		const JWTSecret = process.env.JWTSecret || "placeholder";
		const decoded = jwt.verify(testToken[1], JWTSecret);
		console.log(decoded);
		return decoded.username;
	} catch (error) {
		console.error(error);
		return null;
	}
};
