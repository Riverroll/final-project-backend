const express = require("express");
const { supplierController } = require("../controllers");

const router = express.Router();

router.get("/", supplierController.all);
router.get("/master", supplierController.master);
router.get("/master-dynamic", supplierController.masterDynamic);
router.post("/", supplierController.create);
router.delete("/:id", supplierController.delete);
router.get("/:id", supplierController.detail);
router.put("/:id", supplierController.update);

module.exports = router;
