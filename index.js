const dotenv = require("dotenv");
const connectDB = require("./src/database/index.js");

dotenv.config();
const { createQueueIfNotExists } = require("./src/config/sqsClient.js");
const express = require("express");
const router = require("./src/router/index.js");

const app = express();
app.use(express.json());

const startServer = async () => {
  try {
    await connectDB();
    console.log("Connected to database successfully");
    const port = process.env.PORT || 3000;
    app.get("/", (req, res) => {
      res.send("Server is running");
    });
    app.use(router);
    app.listen(port, async () => {
      await createQueueIfNotExists();
      console.log(`Server running on port ${port}`);
    });
  } catch (e) {
    console.error("Failed to start server", e);
  }
};

startServer();
