const express = require("express");
const { dataController } = require("../controllers");

const router = express.Router();

router.post("/", dataController.dataDashboard);
router.post("/user", dataController.dataUser);

module.exports = router;
