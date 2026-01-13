const controller = require("../controller/cep.contrroller");

const router = require("express").Router();
router.post("/crawler", controller.crawler);
router.get("/crawler/:id/results", controller.getResults);
module.exports = router;
