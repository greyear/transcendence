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

// create user.
//Check for existance. If not, attempt to has password and create new user
//userModel({username: name}, {passwordHash: hash});
app.post('/register', async (req, res) =>
{
	try {
		const document = await userModel.find({username: req.body.username});

		if (!document)
		{
			const hashedPassword = hashPassword(req.body.password);
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