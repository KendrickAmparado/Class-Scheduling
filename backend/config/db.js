// db.js
const mongoose = require('mongoose');
require('dotenv').config(); // to load ENV variables from .env file

const url = process.env.MONGO_URI;

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(url, connectionParams)
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.error(`Error connecting to the database: ${err}`);
  });
