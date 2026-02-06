const express = require('express');
const mongoose = require('mongoose');
const userModel = require('./auth_schema'); // Importing userModel from schema

//skeleton of functions, they will need error handling at the very least
// they will also need to account for more database fields
// I suppose req.body will depend on what the request ultimately looks like
// all shit to sort out later on, a problem for future Eric
//maybe they will not need to take in req, res, depending on further up

// create user
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