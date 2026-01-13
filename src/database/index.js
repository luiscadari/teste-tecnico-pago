const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    try {
      const connectionString = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
      await mongoose.connect(connectionString);
      isConnected = true;
    } catch (e) {
      console.error("Error connecting to database", e);
      throw e;
    }
  }
};

module.exports = connectDB;
