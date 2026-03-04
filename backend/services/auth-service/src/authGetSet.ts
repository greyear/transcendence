/*
	express is our backend node.js framework
	mongoose is a mongodb convenience library for node.js
	bcrypt is our password hashing module
	jsonwebtoken is an encrypted way to pass sesson data client/server
 */
import { Router } from "express";

// Importing userModel from schema
//Location of this may or may not change later.
import { userModel } from "./auth_schema.ts";

export const authGetSet = Router();

/*
	Delete user. /users/:username endpoint
		1. Attempt to hash new password
		2. findOneAndDelete() to remove matching record
		4. Return relevant code
*
authGetSet.delete('/users/:username', async (req, res) =>
{
	try {
		const userDocument = await userModel.findOneAndDelete( {username: req.params.username} );

		if (!userDocument)
			return res.status(404).json({error: 'User not found'});

		return res.json({ message: 'User deleted' });
	
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
*/

//Fetch single user record
//Return all but passwordHash
authGetSet.get("/users/:username", async (req, res) => {
	try {
		const userDocument = await userModel.findOne(
			{ username: req.params.username },
			{ username: 1, email: 1, realName: 1 },
		);

		if (!userDocument) return res.status(404).json({ error: "User not found" });

		return res.json(userDocument);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

//Fetch all user records
//Return all but passwordHash
authGetSet.get("/users", async (req, res) => {
	try {
		const userDocument = await userModel.find(
			{},
			{ username: 1, email: 1, realName: 1 },
		);

		if (!userDocument)
			return res.status(404).json({ error: "Records not found" });

		return res.json(userDocument);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

/*
	Change user password. /users/:username endpoint
		1. Attempt to hash new password
		2. findOneAndUpdate() to update the record with new hash
			Find by URI param. Recreate record with new data
		3. If good, create JWT and return
		4. Return relevant code
*
authGetSet.put('/users/:username', async (req, res) =>
{
	try {
		if (!validatePassword(req.body.password))
			return res.status(422).json({error: "The password doesn't match the password requirements"});

		const hashedPassword = await hashPassword(req.body.password);
		if (!hashedPassword)
			return res.status(500).json({error: 'Hashing failed'});

		const userDocument = await userModel.findOneAndUpdate(
			{username: req.params.username},
			{passwordHash: hashedPassword},
			{new: true}
			);

		if (userDocument)
			return res.json(userDocument);
		
		return res.status(404).json({error: 'User not found'});
	
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});
*/
