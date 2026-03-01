//Everyone seems to use mongoose, so I will too.
import mongoose from 'mongoose';

//auth_db schema
//https://mongoosejs.com/docs/guide.html
//https://www.mongodb.com/docs/manual/core/document/
//https://www.slingacademy.com/article/mongodb-set-default-value-for-a-field-with-examples/
//_id will be created by default and have an ObjectId value
// createdAt should be created automatically on document creation
//email may be the same for Google ID, but we shall see
const authSchema = new mongoose.Schema
({
  username: {
	type: String,
	required: true,
	unique: true
  },
  email: {
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
export const userModel = mongoose.model('userModel', authSchema);
