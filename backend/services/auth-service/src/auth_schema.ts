//Everyone seems to use mongoose, so I will too.
import mongoose from "mongoose";

// Source - https://stackoverflow.com/a/30164636
// Posted by edtech
// Retrieved 2026-03-18, License - CC BY-SA 3.0
const counterSchema = new mongoose.Schema({
	name: {
		type: String,
		default: "CounterDB",
		required: true,
	},
	seq: {
		type: Number,
		default: 1,
		required: true,
	},
});

//auth_db schema
//https://mongoosejs.com/docs/guide.html
//https://www.mongodb.com/docs/manual/core/document/
//https://www.slingacademy.com/article/mongodb-set-default-value-for-a-field-with-examples/
//_id will be created by default and have an ObjectId value
//email may be the same for Google ID, but we shall see
//Google suggests using account Google ID rather than email for user search
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
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	passwordHash: {
		type: String,
		required: true,
		unique: false,
	},
	realname: {
		type: String,
		required: true,
		unique: false,
	},
	googleID: {
		type: String,
		required: false,
		unique: true,
	},
});

//Convert schema into a model that can be worked on
//https://mongoosejs.com/docs/models.html
export const userModel = mongoose.model("userModel", authSchema);
export const userCounter = mongoose.model("userCounter", counterSchema);
