const express = require("express");
const { productController } = require("../controllers");

const router = express.Router();

// Product List
router.get("/all", productController.all);
router.get("/master", productController.master);
router.delete("/delete/:id", productController.delete);
router.post("/create", productController.create);
router.put("/update/:id", productController.update);
router.get("/detail/:id", productController.detail);

// Product Type
router.get("/type/all", productController.allType);
router.post("/type/create", productController.createType);
router.get("/type/detail/:id", productController.detailType);
router.put("/type/update/:id", productController.updateType);
router.delete("/type/delete/:id", productController.deleteType);

// Product Merk
router.get("/merk/all", productController.allMerk);
router.post("/merk/create", productController.createMerk);
router.get("/merk/detail/:id", productController.detailMerk);
router.put("/merk/update/:id", productController.updateMerk);
router.delete("/merk/delete/:id", productController.deleteMerk);

module.exports = router;
