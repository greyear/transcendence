/*
	express is our backend node.js framework
	mongoose is a mongob convenience library for node.js
	bcrypt is our password hashing module
	jsonwebtoken is an encrypted way to pass sesson data client/server
 */
const express = require('express');
const app = express();

const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

// Importing userModel from schema
const userModel = require('./auth_schema.ts');

//Connection port
const port = 3000;

// Parse incoming JSON requests automatically
//https://www.geeksforgeeks.org/node-js/getting-started-with-express-js/
app.use(express.json());

// Connect to MongoDB
// https://mongoosejs.com/docs/connections.html
mongoose.connect('mongodb://127.0.0.1:27017/auth_db').then(() =>
{
    console.log('Connected to MongoDB');
    // Start the server after the database connection is established
    app.listen(port, () => {
    	console.log(`Server is running on http://localhost:${port}`);
    });
}).catch((err) => {
	console.log('Error connecting to MongoDB:', err);
});

// Password hashing, using bcrypt. I think slightly simpler than others.
const hashPassword = async (password) =>
{
	const saltCost = 5;

	try {
		const salt = await bcrypt.genSalt(saltCost);
		const hash = await bcrypt.hash(password, salt);
		return hash;
	} catch (error) {
		console.log(error);
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
		console.log(error);
	}
	return false;
};

// Call this method after credential verification
const generateToken = (username) =>
{
	const JWTSecret = "supersecretsecurity";

	const payload = {
		username: username,
		iat: Math.floor(Date.now() / 1000),
		exp: 3600 //1 hour
	};

	return jwt.sign(payload, JWTSecret, {
		algorithm: "HS256",
	});
};

/*
	Create user if user does not exist.
		1. Check for existance. Try username and email
			findOne() because usernames/emails are unique in the DB
		2. If not, attempt to hash password and create new user
		3. Return relevant code
*/
app.post('/register', async (req, res) =>
{
	try {
		const document = await userModel.findOne(
			{ $or: [
					{email: req.body.username},
					{username: req.body.username}
				 ]
			} );

		if (!document)
		{
			const hashedPassword = await hashPassword(req.body.password);
			if (hashedPassword)
			{
				const newUser = new userModel({
												username:req.body.username,
												email:req.body.email,
												passwordHash:hashedPassword
											 });
				const retPromise = await newUser.save();
				res.status(201).json(retPromise);
				//What is the creation or save fails? Look into that.
			}
			else
				res.status(500).json({error: 'Hashing failed'});
		}
		else
			res.status(409).json({error: 'Resource exists'});

	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

/*
	Login with username/email and password.
		1. Check for existance. Try username and email
			findOne() because usernames/emails are unique in the DB
		2. If so, check password using bcrypt
		3. If good, create JWT and return
		4. Return relevant code
*/
app.post('/login', async (req, res) =>
{
	try {
		const document = await userModel.findOne(
			{ $or: [
					{email: req.body.username},
					{username: req.body.username}
				 ]
			} );

		if (!document)
			res.status(404).json({error: 'User not found'});
		else
		{
			const gotHash = document.get('passwordHash');
			if (!comparePassword(req.body.password, gotHash))
				res.status(401).json({ error: 'Password mismatch' });
			else
			{
				const JWToken = generateToken(req.body.username);
				res.append('JWT', JWToken);
				res.sendStatus(200);
			}
		}

	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

/*
	Change user password. /users/:username endpoint
		1. Attempt to hash new password
		2. findOneAndUpdate() to update the record with new hash
			Find by URI param. Recreate record with new data
		3. If good, create JWT and return
		4. Return relevant code
*/
app.put('/users/:username', async (req, res) =>
{
	try {
		const hashedPassword = await hashPassword(req.body.password);

		if (hashedPassword)
		{
			const document = await userModel.findOneAndUpdate(
				{username: req.params.username},
				{passwordHash: hashedPassword},
				{new: true}
				);

			if (!document)
				res.status(404).json({error: 'User not found'});

			res.json(document);
		}
		else
			res.status(500).json({error: 'Hashing failed'});
	
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//Fetch single user record
app.get('/users/:username', async (req, res) =>
{
	try {
		const document = await userModel.findOne({username: req.params.username});

		if (!document)
			res.status(404).json({error: 'User not found'});
		else
			res.json(document);

	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//Fetch all user records
app.get('/users', async (req, res) =>
{
	try {
		const document = await userModel.find();

		if (!document)
			res.status(404).json({error: 'Records not found'});
		else
			res.json(document);

	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});
