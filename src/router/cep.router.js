const controller = require("../controller/cep.contrroller");

const router = require("express").Router();
router.post("/crawler", controller.crawler);
router.get("/crawler/:id/results", controller.getResults);
router.get("/crawler/:id", controller.getStatus);
module.exports = router;
