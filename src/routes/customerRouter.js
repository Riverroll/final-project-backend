const express = require("express");
const { customerController } = require("../controllers");

const router = express.Router();

router.get("/all", customerController.all);
router.get("/master/:id", customerController.master);

module.exports = router;
