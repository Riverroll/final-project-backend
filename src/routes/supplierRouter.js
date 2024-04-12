const express = require("express");
const { supplierController } = require("../controllers");

const router = express.Router();

router.get("/all", supplierController.all);

module.exports = router;
