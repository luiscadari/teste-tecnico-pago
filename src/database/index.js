const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionString = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
    await connectDB(connectionString);
  } catch (e) {
    console.error("Error connecting to database", e);
    throw e;
  }
};

module.exports = connectDB;
