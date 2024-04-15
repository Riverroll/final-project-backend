const express = require("express");
const { supplierController } = require("../controllers");

const router = express.Router();

router.get("/all", supplierController.all);
router.get("/master", supplierController.master);
router.get("/master-dynamic", supplierController.masterDynamic);
router.post("/create", supplierController.create);
router.delete("/delete/:id", supplierController.delete);
router.get("/detail/:id", supplierController.detail);
router.put("/update/:id", supplierController.update);

module.exports = router;
