//Everyone seems to use mongoose, so I will too.
import mongoose from "mongoose";

/*
 * DB schema for user "id" counter tracking.
 * This is a workaround for MongoDB's lack of auto-incrementing.
 * Source - https://stackoverflow.com/a/30164636
 * Posted by edtech. Retrieved 2026-03-18
 */
const counterSchema = new mongoose.Schema({
	name: {
		type: String,
		default: "CounterDB",
		required: true,
		unique: true,
	},
	seq: {
		type: Number,
		default: 1,
		required: true,
	},
});

/*
 * auth_db schema
 * https://mongoosejs.com/docs/guide.html
 * https://www.mongodb.com/docs/manual/core/document/
 * https://www.slingacademy.com/article/mongodb-set-default-value-for-a-field-with-examples/
 * _id will be created by default and have an ObjectId value
 * email may be the same for Google ID, but we shall see
 * 		Google suggests using account Google ID rather than email for user search
 * passwordHash will be "empty" for Google login.
 * isActive allows an account to be made unusable for myriad rationales.
 * 		If the account needs fully deleting, it will need to be done from mongosh.
 */
const authSchema = new mongoose.Schema({
	id: {
		type: Number,
		required: true,
		unique: true,
	},
	username: {
		type: String,
		required: false,
		unique: true,
		sparse: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
		sparse: true,
	},
	passwordHash: {
		type: String,
		required: true,
		unique: false,
	},
	googleID: {
		type: String,
		required: false,
		unique: true,
		sparse: true,
	},
	isActive: {
		// realname is removed. isActive is added.
		type: Boolean,
		default: true,
	},
});

//Convert schema into a model that can be worked on
//https://mongoosejs.com/docs/models.html
export const userModel = mongoose.model("userModel", authSchema);
export const userCounter = mongoose.model("userCounter", counterSchema);
