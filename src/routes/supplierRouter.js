const express = require("express");
const { supplierController } = require("../controllers");

const router = express.Router();

router.get("/all", supplierController.all);
router.get("/master", supplierController.master);
router.get("/master-dynamic", supplierController.masterDynamic);
router.post("/create", supplierController.create);

module.exports = router;
