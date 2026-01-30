// app.js
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB when I figure out how/where/etc this likely will be changed
mongoose.connect('mongodb://127.0.0.1:27017/test'
).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

