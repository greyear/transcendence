//Everyone seems to use mongoose, so I will too.
import mongoose from 'mongoose';
const { Schema } = mongoose;

//auth_db schema
//https://mongoosejs.com/docs/guide.html
const authSchema = new Schema
({
  _id: {
    type: ObjectId,
    required: true,
	unique: true
  },
  username: {
	type: String,
	required: true,
	unique: true
  },
  passwordHash: {
    type: String,
    required: true,
    unique: false
  },
  createdAt: {
    type: Date,
    required: true,
    unique: false,
	default: Date.now
  }
});

//Convert schema into a model that can be worked on
//https://mongoosejs.com/docs/models.html
const authModel = mongoose.model('authModel', authSchema);

module.exports = authModel;