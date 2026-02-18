const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

// Importing userModel from schema
const userModel = require('./auth_schema');

// For parsing application/json
app.use(express.json());

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
		exp: "1h",
	};

	return jwt.sign(payload, JWTSecret, {
		algorithm: "HS256",
		expiresIn: "1h",
	});
};

// create user.
//Check for existance. If not, attempt to hash password and create new user
//userModel({username: name}, {passwordHash: hash});
app.post('/register', async (req, res) =>
{
	try {
		const document = await userModel.find({username: req.body.username});

		if (!document)
		{
			const hashedPassword = await hashPassword(req.body.password);
			if (hashedPassword)
			{
				const newUser = new userModel( {username: req.body.username}, {passwordHash: hashedPassword} );
				const retPromise = await newUser.save();
				res.status(201).json(retPromise);
			}
			else
				res.status(500).json({error: 'Hashing failed'});
		}
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

// login user
//Check for existance. If so, check password. If good, create token and return
app.post('/login', async (req, res) =>
{
	try {
		const document = await userModel.find({username: req.body.username});

		if (!document)
			res.status(404).json({error: 'User not found'});

		const gotHash = document.get('passwordHash');
		if (!comparePassword(req.body.passwordHash, gotHash))
			res.status(401).json({ error: 'Password mismatch' });

		const JWToken = generateToken(req.body.username);
		res.append('JWT', JWToken);
		res.sendStatus(200);

	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

/* create user
create(async (req, res) =>
{
	//userModel({username: name}, {passwordHash: hash});
	const newUser = new userModel(req.body);
	const retPromise = await newUser.save();
	res.status(201).json(retPromise);
});

//read
read(async (req, res) => 
{
	const document = await userModel.find({username: req.params.username});
	if (!document)
	{
		return res.status(404).json({error: 'Username not found'});
	}

	res.status(200).json(document);
	return 
});

//delete user
del(async (req, res) =>
{
	const document = await userModel.find({username: req.params.username});
	if (!document)
	{
		return res.status(404).json({error: 'Username not found'});
	}

	res.status(204).json({message: 'Username deleted'});
});

//update user
update(async (req, res) =>
{
	const document = await userModel.find({username: req.params.username});
	if (!document)
	{
		return res.status(404).json({error: 'Username not found'});
	}

	res.
	res.status(204).json({message: 'Username deleted'});
});
*/