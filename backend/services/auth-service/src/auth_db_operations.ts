/*
	express is our backend node.js framework
	mongoose is a mongodb convenience library for node.js
	bcrypt is our password hashing module
	jsonwebtoken is an encrypted way to pass sesson data client/server
	zod is our parsing and field validation module
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import * as z from "zod";

// Importing userModel from schema
//Location of this may or may not change later.
import { userModel } from './auth_schema.ts'; 

export const authRouter = Router();

//Connection part probably being moved later
const MONGO_AUTH_URI = process.env.MONGODB_AUTH_URI || 'mongodb://127.0.0.1:27017/auth_db';
// Connect to MongoDB
// https://mongoosejs.com/docs/connections.html
mongoose.connect(MONGO_AUTH_URI).then(() =>
{
    console.log('Connected to MongoDB');
    // Start the server after the database connection is established
    
}).catch((err) => {
	console.error('Error connecting to MongoDB:', err);
	process.exit(1);
});

// Password hashing, using bcrypt. I think slightly simpler than others.
//Concern with security of the salt.
//Maybe change to argon2
const hashPassword = async (password) =>
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
const comparePassword = async (password, hash) =>
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
const validateEmail = (email) =>
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
const validatePassword = (password) =>
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
const generateToken = (id, username) =>
{
	const JWTSecret = process.env.JWTSecret || "";

	const payload = {
        sub: id,
        username,
    };

	return jwt.sign(payload, JWTSecret, {
		algorithm: "HS256", expiresIn: "1h"
	});
};

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
authRouter.post('/register', async (req, res) =>
{
	try {
		const {username, email, realname, password} = req.body;

		const userDocument = await userModel.findOne(
			{ $or: [
					{email},
					{username}
				   ]
			} );

		if (userDocument)
			return res.status(409).json({error: 'Resource exists'});

		if (!validateEmail(req.body.email))
			return res.status(422).json({error: 'Invalid email address'});

		if (!validatePassword(req.body.password))
			return res.status(422).json({error: "The password doesn't match the password requirements"});

		const hashedPassword = await hashPassword(password);
		if (!hashedPassword)
			return res.status(500).json({error: 'Hashing failed'});

		const newUser = new userModel({
										username,
										email,
										passwordHash:hashedPassword,
										realname
										});
		const retPromise = await newUser.save();

		return res.status(201).json({username, email, realname});

	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

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
authRouter.post('/login', async (req, res) =>
{
	try {
		const {username, password} = req.body;

		const userDocument = await userModel.findOne(
			{ $or: [
					{email: username},
					{username}
				   ]
			} );

		if (!userDocument)
			return res.status(404).json({error: 'User not found'});
			
		const gotHash = userDocument.get('passwordHash');
		if (!comparePassword(password, gotHash))
			return res.status(401).json({ error: 'Password mismatch' });
		
		const JWToken = generateToken(userDocument.get('_id'), username);
		return res.status(200).json({ 
					token: JWToken,
					message: "Login successful" 
		});

	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
