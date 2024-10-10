const productService = require("../services/productService");
const responseFormatter = require("../utils/responseFormatter");

module.exports = {
  allProducts: async (req, res) => {
    try {
      const products = await productService.getAllProducts();
      return res
        .status(200)
        .send(responseFormatter(200, "Get All Products Success", products));
    } catch (error) {
      console.error("Get All Products Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },
  // not used single create
  createProduct: async (req, res) => {
    try {
      const { productName, productTypeId, productMerkId, price, stock } =
        req.body;

      const errors = [];
      if (!productName)
        errors.push({ field: "name", message: "Product Name is required" });
      if (!productTypeId)
        errors.push({
          field: "typeId",
          message: "Product Type ID is required",
        });
      if (!productMerkId)
        errors.push({
          field: "merkId",
          message: "Product Merk ID is required",
        });
      if (price === undefined)
        errors.push({ field: "price", message: "Price is required" });
      if (stock === undefined)
        errors.push({ field: "stock", message: "Stock is required" });

      if (errors.length > 0) {
        return res
          .status(400)
          .send(responseFormatter(400, "Validation Error", errors));
      }

      await productService.createProduct({
        productName,
        productTypeId,
        productMerkId,
        price,
        stock,
      });
      return res
        .status(201)
        .send(responseFormatter(201, "Product created successfully"));
    } catch (error) {
      console.error("Create Product Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  detailProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await productService.getProductDetail(id);

      if (!product) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product not found"));
      }

      return res
        .status(200)
        .send(responseFormatter(200, "Get Product Detail Success", product));
    } catch (error) {
      console.error("Product Detail Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        productName,
        productTypeId,
        productMerkId,
        stock,
        expired,
        aklAkd,
      } = req.body;

      const errors = [];
      if (!productName)
        errors.push({ field: "name", message: "Product Name is required" });
      if (!productTypeId)
        errors.push({
          field: "typeId",
          message: "Product Type ID is required",
        });
      if (!productMerkId)
        errors.push({
          field: "merkId",
          message: "Product Merk ID is required",
        });
      if (stock === undefined)
        errors.push({ field: "stock", message: "Stock is required" });

      if (errors.length > 0) {
        return res
          .status(400)
          .send(responseFormatter(400, "Validation Error", errors));
      }

      const result = await productService.updateProduct(id, {
        productName,
        productTypeId,
        productMerkId,
        // price,
        stock,
        expired,
        aklAkd,
      });

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product not found"));
      }

      return res
        .status(200)
        .send(responseFormatter(200, "Product updated successfully"));
    } catch (error) {
      console.error("Update Product Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Failed to update Product"));
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send(responseFormatter(400, "ID is required"));
      }

      const result = await productService.deleteProduct(id);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product not found"));
      }

      return res.status(200).send(
        responseFormatter(200, "Product deleted successfully", {
          deletedId: id,
        })
      );
    } catch (error) {
      console.error("Delete Product Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Failed to delete Product"));
    }
  },

  allCreate: async (req, res) => {
    try {
      const { productList } = req.body;

      const { errors, results } = await productService.createProducts(
        productList
      );

      if (errors.length > 0) {
        return res
          .status(400)
          .send(responseFormatter(400, "Validation Error", errors));
      }

      return res
        .status(200)
        .send(responseFormatter(200, "Products created successfully", results));
    } catch (error) {
      console.error("Create Product Error:", error);
      return res
        .status(500)
        .send(
          responseFormatter(500, error.message || "Failed to create Product")
        );
    }
  },
  master: async (req, res) => {
    try {
      const masterData = await productService.getMasterData();

      return res
        .status(200)
        .send(
          responseFormatter(200, "Get Product Master Data Success", masterData)
        );
    } catch (error) {
      console.error("Product Master All Error:", error);
      return res
        .status(500)
        .send(
          responseFormatter(
            500,
            error.message || "Failed to retrieve master data"
          )
        );
    }
  },

  productExpiredDetail: async (req, res) => {
    try {
      const { id } = req.params;

      const expiredProducts = await productService.getProductExpiredDetails(id);

      return res
        .status(200)
        .send(
          responseFormatter(
            200,
            "Get Products Expired Data Success",
            expiredProducts
          )
        );
    } catch (error) {
      console.error("Products Expired All Error:", error);
      return res
        .status(500)
        .send(
          responseFormatter(
            500,
            error.message || "Failed to retrieve expired products"
          )
        );
    }
  },

  productSupplier: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .send(responseFormatter(400, "Supplier ID is required"));
      }

      const masterProduct = await productService.getProductsBySupplier(id);

      return res
        .status(200)
        .send(
          responseFormatter(
            200,
            "Get Master Dynamic Transaction Data Success",
            { product: masterProduct }
          )
        );
    } catch (error) {
      console.error("Master Dynamic Transaction Error:", error);
      return res
        .status(500)
        .send(
          responseFormatter(
            500,
            error.message || "Failed to retrieve products for supplier"
          )
        );
    }
  },

  // ------------- Product Type Controller Methods --------------

  allType: async (req, res) => {
    try {
      const productTypes = await productService.getAllProductTypes();
      return res
        .status(200)
        .send(
          responseFormatter(200, "Get Products Type Data Success", productTypes)
        );
    } catch (error) {
      console.error("Products Type All Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  createType: async (req, res) => {
    try {
      const { typeName } = req.body;

      const errors = [];
      if (!typeName) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (errors.length > 0) {
        return res
          .status(400)
          .send(responseFormatter(400, "Validation Error", errors));
      }

      await productService.createProductType(typeName);
      return res
        .status(200)
        .send(responseFormatter(200, "Product Type created successfully"));
    } catch (error) {
      console.error("Product Type Creation Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  detailType: async (req, res) => {
    try {
      const { id } = req.params;
      const productType = await productService.getProductTypeDetail(id);

      if (!productType) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product Type not found"));
      }

      return res
        .status(200)
        .send(
          responseFormatter(200, "Get Product Type Detail Success", productType)
        );
    } catch (error) {
      console.error("Product Type Detail Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  updateType: async (req, res) => {
    try {
      const { id } = req.params;
      const { typeName } = req.body;

      const errors = [];
      if (!typeName) {
        errors.push({
          field: "name",
          message: "Product Type Name is required",
        });
      }

      if (errors.length > 0) {
        return res
          .status(400)
          .send(responseFormatter(400, "Validation Error", errors));
      }

      const result = await productService.updateProductType(id, { typeName });

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product Type not found"));
      }

      return res
        .status(200)
        .send(responseFormatter(200, "Product Type updated successfully"));
    } catch (error) {
      console.error("Product Type Update Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Failed to update Product Type"));
    }
  },

  deleteType: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send(responseFormatter(400, "ID is required"));
      }

      const result = await productService.deleteProductType(id);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product Type not found"));
      }

      return res.status(200).send(
        responseFormatter(200, "Product Type deleted successfully", {
          deletedId: id,
        })
      );
    } catch (error) {
      console.error("Delete Product Type Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Failed to delete Product Type"));
    }
  },

  // ------------- Product Merk Controller Methods --------------

  allMerk: async (req, res) => {
    try {
      const productMerks = await productService.getAllProductMerks();
      return res
        .status(200)
        .send(
          responseFormatter(200, "Get Products Merk Data Success", productMerks)
        );
    } catch (error) {
      console.error("Products Merk All Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  createMerk: async (req, res) => {
    try {
      const { merkName } = req.body;

      const errors = [];
      if (!merkName) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (errors.length > 0) {
        return res
          .status(400)
          .send(responseFormatter(400, "Validation Error", errors));
      }

      await productService.createProductMerk({ merkName });
      return res
        .status(200)
        .send(responseFormatter(200, "Product Merk created successfully"));
    } catch (error) {
      console.error("Product Merk Creation Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  detailMerk: async (req, res) => {
    try {
      const { id } = req.params;
      const productMerk = await productService.getProductMerkDetail(id);

      if (!productMerk) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product Merk not found"));
      }

      return res
        .status(200)
        .send(
          responseFormatter(200, "Get Product Merk Detail Success", productMerk)
        );
    } catch (error) {
      console.error("Product Merk Detail Error:", error);
      return res.status(500).send(responseFormatter(500, error.message));
    }
  },

  updateMerk: async (req, res) => {
    try {
      const { id } = req.params;
      const { merkName } = req.body;

      const errors = [];
      if (!merkName) {
        errors.push({
          field: "name",
          message: "Product Merk Name is required",
        });
      }

      if (errors.length > 0) {
        return res
          .status(400)
          .send(responseFormatter(400, "Validation Error", errors));
      }

      const result = await productService.updateProductMerk(id, { merkName });

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product Merk not found"));
      }

      return res
        .status(200)
        .send(responseFormatter(200, "Product Merk updated successfully"));
    } catch (error) {
      console.error("Product Merk Update Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Failed to update Product Merk"));
    }
  },

  deleteMerk: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send(responseFormatter(400, "ID is required"));
      }

      const result = await productService.deleteProductMerk(id);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .send(responseFormatter(404, "Product Merk not found"));
      }

      return res.status(200).send(
        responseFormatter(200, "Product Merk deleted successfully", {
          deletedId: id,
        })
      );
    } catch (error) {
      console.error("Delete Product Merk Error:", error);
      return res
        .status(500)
        .send(responseFormatter(500, "Failed to delete Product Merk"));
    }
  },
};
