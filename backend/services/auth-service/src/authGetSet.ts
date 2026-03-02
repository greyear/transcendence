/*
	express is our backend node.js framework
	mongoose is a mongodb convenience library for node.js
	bcrypt is our password hashing module
	jsonwebtoken is an encrypted way to pass sesson data client/server
 */
import { Router } from 'express';

// Importing userModel from schema
//Location of this may or may not change later.
import { userModel } from './auth_schema.ts';

export const authGetSet = Router();

/*
	Delete user. /users/:username endpoint
		1. Attempt to hash new password
		2. findOneAndDelete() to remove matching record
		4. Return relevant code
*/
authGetSet.delete('/users/:username', async (req, res) =>
{
	try {
		const userDocument = await userModel.findOneAndDelete( {username: req.params.username} );

		if (!userDocument)
			return res.status(404).json({error: 'User not found'});
		else
			res.json({ message: 'User deleted' });
	
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//Fetch single user record
//Return all but passwordHash
authGetSet.get('/users/:username', async (req, res) =>
{
	try {
		const userDocument = await userModel.findOne({username: req.params.username},
													 {username: 1, email: 1, realName: 1});

		if (!userDocument)
			res.status(404).json({error: 'User not found'});
		else
			res.json(userDocument);

	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

//Fetch all user records
//Return all but passwordHash
authGetSet.get('/users', async (req, res) =>
{
	try {
		const userDocument = await userModel.find({},{username: 1, email: 1, realName: 1});

		if (!userDocument)
			res.status(404).json({error: 'Records not found'});
		else
			res.json(userDocument);

	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});
