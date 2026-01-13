const express = require("express");
const cepRouter = require("./cep.router");
const app = express();
const router = express.Router();
router.use("/cep", cepRouter);

module.exports = router;
