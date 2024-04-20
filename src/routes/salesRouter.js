const express = require("express");
const { salesController } = require("../controllers");

const router = express.Router();

router.get("/all", salesController.all);
router.get("/master", salesController.master);
router.get("/master-dynamic", salesController.masterDynamic);
router.post("/create", salesController.create);
router.delete("/delete/:id", salesController.delete);
router.get("/detail/:id", salesController.detail);
router.put("/update/:id", salesController.update);

module.exports = router;
