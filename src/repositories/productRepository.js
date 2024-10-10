const { query } = require("../database");

module.exports = {
  // ------------- Product Repository Methods --------------
  fetchAllProducts: async () => {
    const sql = `SELECT p.*, pt.type_name, pm.merk_name, s.supplier_code, 
                 COALESCE(SUM(pe.quantity), 0) AS total_stock 
                 FROM products p
                 LEFT JOIN product_type pt ON pt.product_type_id = p.product_type
                 LEFT JOIN product_merk pm ON pm.product_merk_id = p.product_merk
                 LEFT JOIN product_expired pe ON pe.product_id = p.product_id
                 LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
                 GROUP BY p.product_id
                 ORDER BY p.created_at DESC`;
    const rows = await query(sql);
    return rows;
  },

  fetchMasterData: async () => {
    const countTotalProduct = await query(
      `SELECT COUNT(*) AS totalProduct FROM products`
    );
    const countTotalProductType = await query(
      `SELECT COUNT(*) AS totalProductType FROM product_type`
    );
    const countTotalProductMerk = await query(
      `SELECT COUNT(*) AS totalProductMerk FROM product_merk`
    );
    const mostStockProduct = await query(
      `SELECT product_name FROM products ORDER BY stock DESC LIMIT 1`
    );

    return {
      totalProduct: countTotalProduct[0].totalProduct,
      totalProductMerk: countTotalProductMerk[0].totalProductMerk,
      totalProductType: countTotalProductType[0].totalProductType,
      mostStockProduct: mostStockProduct[0]?.product_name || null,
    };
  },

  deleteProduct: async (id) => {
    const result = await query(`DELETE FROM products WHERE product_id = ?`, [
      id,
    ]);
    return result;
  },

  createProduct: async (productData) => {
    const {
      newProductId,
      name,
      productType,
      productMerk,
      aklAkd,
      price,
      stock,
      expired,
      supplierId,
      createdDate,
    } = productData;
    const result = await query(
      `INSERT INTO products (product_id, product_name, product_type, product_merk, akl_akd, price, stock, isExpired, supplier_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newProductId,
        name,
        productType,
        productMerk,
        aklAkd,
        price,
        stock,
        expired,
        supplierId,
        createdDate,
      ]
    );
    return result;
  },

  bulkCreateProducts: async (productList) => {
    const results = [];
    for (const product of productList) {
      const {
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
      } = product;
      const result = await query(
        `INSERT INTO products (product_id, product_name, product_type, product_merk, akl_akd, stock, isExpired, supplier_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
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
        ]
      );
      results.push(result);
    }
    return results;
  },

  updateProduct: async (id, productData) => {
    const {
      productName,
      aklAkd,
      expired,
      // price,
      stock,
      productTypeId,
      productMerkId,
      updatedDate,
    } = productData;
    const result = await query(
      `UPDATE products 
      SET product_name = ?, product_type = ?, product_merk = ?, akl_akd = ?,  stock = ?, isExpired = ?, updated_at = ? 
      WHERE product_id = ?`,
      [
        productName,
        productTypeId,
        productMerkId,
        aklAkd,
        // price,
        stock,
        expired,
        updatedDate,
        id,
      ]
    );
    return result;
  },

  fetchProductDetail: async (id) => {
    const [rows] = await query(`SELECT * FROM products WHERE product_id = ?`, [
      id,
    ]);
    return rows;
  },

  getTotalProducts: async () => {
    const result = await query(`SELECT COUNT(*) AS totalProduct FROM products`);
    return result[0].totalProduct;
  },

  getTotalProductTypes: async () => {
    const result = await query(
      `SELECT COUNT(*) AS totalProductType FROM product_type`
    );
    return result[0].totalProductType;
  },

  getTotalProductMerks: async () => {
    const result = await query(
      `SELECT COUNT(*) AS totalProductMerk FROM product_merk`
    );
    return result[0].totalProductMerk;
  },

  getMostStockProduct: async () => {
    const result = await query(
      `SELECT product_name FROM products ORDER BY stock DESC LIMIT 1`
    );
    return result[0].product_name;
  },

  getSupplierCode: async (supplierId) => {
    const result = await query(
      `SELECT supplier_code FROM suppliers WHERE supplier_id = ?`,
      [supplierId]
    );
    return result.length > 0 ? result[0].supplier_code : null;
  },

  getLastProductId: async (supplierCode) => {
    const result = await query(
      `SELECT product_id FROM products WHERE product_id LIKE ? ORDER BY product_id DESC LIMIT 1`,
      [`${supplierCode}-%`]
    );
    return result.length > 0 ? result[0].product_id : null;
  },

  getProductExpiredById: async (id) => {
    const result = await query(
      `SELECT * FROM product_expired WHERE product_id = ? ORDER BY expired_date DESC`,
      [id]
    );
    return result;
  },

  getProductsBySupplierId: async (supplierId) => {
    const result = await query(
      `SELECT product_id, product_name, price, stock, isExpired FROM products WHERE supplier_id = ?`,
      [supplierId]
    );
    return result;
  },

  // ------------- Product Type Repository Methods --------------
  fetchAllProductTypes: async () => {
    const sql = "SELECT * FROM product_type ORDER BY created_at DESC";
    const rows = await query(sql);

    return rows;
  },

  insertProductType: async (typeData) => {
    const { typeName } = typeData;
    const createdDate = new Date();
    const sql =
      "INSERT INTO product_type (type_name, created_at) VALUES (?, ?)";
    const result = await query(sql, [typeName, createdDate]);
    return result;
  },

  fetchProductTypeDetail: async (id) => {
    const sql = "SELECT * FROM product_type WHERE product_type_id = ?";
    const rows = await query(sql, [id]);
    return rows[0];
  },

  updateProductTypeById: async (id, typeData) => {
    const { typeName } = typeData;
    const updatedDate = new Date();
    const sql =
      "UPDATE product_type SET type_name = ?, updated_at = ? WHERE product_type_id = ?";
    const result = await query(sql, [typeName, updatedDate, id]);
    return result;
  },

  deleteProductTypeById: async (id) => {
    const sql = "DELETE FROM product_type WHERE product_type_id = ?";
    const result = await query(sql, [id]);
    return result;
  },

  // ------------- Product Merk Repository Methods --------------
  fetchAllProductMerks: async () => {
    const sql = "SELECT * FROM product_merk ORDER BY created_at DESC";
    const rows = await query(sql);
    return rows;
  },

  insertProductMerk: async (merkData) => {
    const { merkName } = merkData;
    const createdDate = new Date();
    const sql =
      "INSERT INTO product_merk (merk_name, created_at) VALUES (?, ?)";
    const result = await query(sql, [merkName, createdDate]);
    return result;
  },

  fetchProductMerkDetail: async (id) => {
    const sql = "SELECT * FROM product_merk WHERE product_merk_id = ?";
    const rows = await query(sql, [id]);
    return rows[0];
  },

  updateProductMerkById: async (id, merkData) => {
    const { merkName } = merkData;
    const updatedDate = new Date();
    const sql =
      "UPDATE product_merk SET merk_name = ?, updated_at = ? WHERE product_merk_id = ?";
    const result = await query(sql, [merkName, updatedDate, id]);
    return result;
  },

  deleteProductMerkById: async (id) => {
    const sql = "DELETE FROM product_merk WHERE product_merk_id = ?";
    const result = await query(sql, [id]);
    return result;
  },
};
