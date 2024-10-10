const express = require("express");
const { productsController } = require("../controllers");

const router = express.Router();

// Product Type
router.get("/type", productsController.allType);
router.get("/type/:id", productsController.detailType);
router.post("/type", productsController.createType);
router.put("/type/:id", productsController.updateType);
router.delete("/type/:id", productsController.deleteType);

// Product Merk
router.get("/merk", productsController.allMerk);
router.post("/merk", productsController.createMerk);
router.get("/merk/:id", productsController.detailMerk);
router.put("/merk/:id", productsController.updateMerk);
router.delete("/merk/:id", productsController.deleteMerk);

// Product Expired Detail
router.get("/expired/:id", productsController.productExpiredDetail);

// Product Filter Supplier
router.get("/supplier/:id", productsController.productSupplier);

// Product List
router.get("/", productsController.allProducts);
router.get("/master", productsController.master);
router.delete("/:id", productsController.deleteProduct);
router.post("/", productsController.createProduct);
router.post("/bulk", productsController.allCreate);
router.put("/:id", productsController.updateProduct);
router.get("/:id", productsController.detailProduct);

module.exports = router;
