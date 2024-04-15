const express = require("express");
const { productController } = require("../controllers");

const router = express.Router();

router.get("/all", productController.all);
router.get("/master", productController.master);
router.delete("/delete/:id", productController.delete);

module.exports = router;
