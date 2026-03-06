import { Router } from 'express';

// Import of project modules
//Location of userModel may or may not change later.
import { userModel } from './auth_schema.ts'; 
import * as help from './authHelpers.ts';

export const authGetSet = Router();

/*
	Delete user. /users/:username endpoint
		1. Attempt to validate JWT from header
		1. findOneAndDelete() to remove matching record
		2. Return relevant code
	As of now does not require the current password.
*/
authGetSet.delete('/users/:username', async (req, res) =>
{
	try {
		const username = req.params.username;

		const validatedJWT = help.validateJWT(req);
		if (!validatedJWT)
			return res.status(401).json({ error: "Invalid token" });
		if (validatedJWT !== username)
			return res.status(401).json({ error: "Incorrect token" });

		const userDocument = await userModel.findOneAndDelete( {username} );

		if (!userDocument)
			return res.status(404).json({error: 'User not found'});

		return res.json({ message: 'User deleted' });
	
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

//Fetch single user record
//Return all but passwordHash
authGetSet.get('/users/:username', async (req, res) =>
{
	try {
		const username = req.params.username;

		const userDocument = await userModel.findOne({username},
													 {username: 1, email: 1, realName: 1});

		if (!userDocument)
			return res.status(404).json({error: 'User not found'});

		return res.json(userDocument);

	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

//Fetch all user records
//Return all but passwordHash
authGetSet.get('/users', async (req, res) =>
{
	try {
		const userDocument = await userModel.find({},{username: 1, email: 1, realName: 1});

		if (!userDocument)
			return res.status(404).json({error: 'Records not found'});

		return res.json(userDocument);

	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

/*
	Change user password. /users/:username endpoint
		1. Attempt to validate JWT from header
		2. Attempt to validate new password format
		3. Attempt to validate old password
		4. Attempt to hash new password
		5. findOneAndUpdate() to update the record with new hash
			Find by URI param. Recreate record with new data
		6. Return relevant code
*/
authGetSet.put('/users/:username', async (req, res) =>
{
	try {
		const {newpassword, password} = req.body;
		const username = req.params.username;

		const validatedJWT = help.validateJWT(req);
		if (!validatedJWT)
			return res.status(401).json({ error: "Invalid token" });
		if (validatedJWT !== username)
			return res.status(401).json({ error: "Incorrect token" });

		if (!help.validatePassword(newpassword))
			return res.status(422).json({error: "The password doesn't match the password requirements"});
		
		const userDocument = await userModel.findOne({username});
		if (!userDocument)
			return res.status(404).json({error: 'User not found'});

		const gotHash = userDocument.get('passwordHash');
		const passwordMatch = await help.comparePassword(password, gotHash);
		if (!passwordMatch)
			return res.status(401).json({ error: 'Password mismatch' });

		const hashedPassword = await help.hashPassword(newpassword);
		if (!hashedPassword)
			return res.status(500).json({error: 'Hashing failed'});

		const toReplaceDoc = await userModel.findOneAndUpdate(
			{username},
			{passwordHash: hashedPassword},
			{new: true}
			);

		if (toReplaceDoc)
			return res.json(toReplaceDoc);
		
		return res.status(404).json({error: 'User not found'});
	
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

// /auth/validate endpoint to specifically validate a JWT within the header.
authGetSet.post('/auth/validate', (req, res) =>
{
	try {
		const validatedJWT = help.validateJWT(req);
		if (!validatedJWT)
			return res.status(401).json({ error: "Invalid token" });

		return res.status(200).json({ username: validatedJWT });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: error.message });
	}
});
