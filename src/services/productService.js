const productRepository = require("../repositories/productRepository");
const moment = require("moment-timezone");
module.exports = {
  // ------------- Product Service Methods --------------
  getAllProducts: async () => {
    return await productRepository.fetchAllProducts();
  },

  getMasterData: async () => {
    return await productRepository.fetchMasterData();
  },

  deleteProduct: async (id) => {
    return await productRepository.deleteProduct(id);
  },

  createProduct: async (productData) => {
    return await productRepository.createProduct(productData);
  },

  updateProduct: async (id, productData) => {
    return await productRepository.updateProduct(id, productData);
  },

  getProductDetail: async (id) => {
    return await productRepository.fetchProductDetail(id);
  },

  createProducts: async (productList) => {
    const errors = [];
    const results = [];
    const validProducts = [];

    for (const product of productList) {
      const {
        product_name,
        akl_akd,
        product_expired,
        supplier,
        // price,
        stock,
        product_type,
        product_merk,
      } = product;

      const supplierCode = await productRepository.getSupplierCode(supplier);
      if (!supplierCode) {
        errors.push({
          field: "supplier",
          message: "Supplier not found",
          product,
        });
        continue;
      }

      const lastProductId = await productRepository.getLastProductId(
        supplierCode
      );

      let newProductId = lastProductId
        ? generateNewProductId(lastProductId, supplierCode)
        : `${supplierCode}-001`;

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      if (!product_name) {
        errors.push({
          field: "product_name",
          message: "Product name is required",
          product,
        });
        continue;
      }

      // if (!price) {
      //   errors.push({ field: "price", message: "Price is required", product });
      //   continue;
      // }

      // Simpan produk yang valid untuk bulk insert
      validProducts.push({
        newProductId,
        product_name,
        product_type,
        product_merk,
        akl_akd,
        // price,
        stock,
        product_expired,
        supplier,
        createdDate,
      });
    }

    // Lakukan bulk insert jika ada produk yang valid
    if (validProducts.length > 0) {
      const bulkResults = await productRepository.bulkCreateProducts(
        validProducts
      );
      results.push(...bulkResults);
    }

    return { errors, results };
  },

  getMasterData: async () => {
    const totalProduct = await productRepository.getTotalProducts();
    const totalProductType = await productRepository.getTotalProductTypes();
    const totalProductMerk = await productRepository.getTotalProductMerks();
    const mostStockProduct = await productRepository.getMostStockProduct();

    return {
      totalProduct,
      totalProductType,
      totalProductMerk,
      mostStockProduct,
    };
  },

  getProductExpiredDetails: async (id) => {
    return await productRepository.getProductExpiredById(id);
  },

  getProductsBySupplier: async (supplierId) => {
    return await productRepository.getProductsBySupplierId(supplierId);
  },

  // ------------- Product Type Service Methods --------------
  getAllProductTypes: async () => {
    return await productRepository.fetchAllProductTypes();
  },

  createProductType: async (typeData) => {
    return await productRepository.insertProductType(typeData);
  },

  getProductTypeDetail: async (id) => {
    return await productRepository.fetchProductTypeDetail(id);
  },

  updateProductType: async (id, typeData) => {
    return await productRepository.updateProductTypeById(id, typeData);
  },

  deleteProductType: async (id) => {
    return await productRepository.deleteProductTypeById(id);
  },

  // ------------- Product Merk Service Methods --------------
  getAllProductMerks: async () => {
    return await productRepository.fetchAllProductMerks();
  },

  createProductMerk: async (merkData) => {
    return await productRepository.insertProductMerk(merkData);
  },

  getProductMerkDetail: async (id) => {
    return await productRepository.fetchProductMerkDetail(id);
  },

  updateProductMerk: async (id, merkData) => {
    return await productRepository.updateProductMerkById(id, merkData);
  },

  deleteProductMerk: async (id) => {
    return await productRepository.deleteProductMerkById(id);
  },
};

function generateNewProductId(lastProductId, supplierCode) {
  const lastNumber = parseInt(lastProductId.split("-")[1]);
  const newNumber = lastNumber + 1;
  const paddedNumber = String(newNumber).padStart(3, "0");
  return `${supplierCode}-${paddedNumber}`;
}
