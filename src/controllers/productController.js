const { pool, query } = require("../database");
const moment = require("moment-timezone");
const env = process.env;

module.exports = {
  all: async (req, res) => {
    try {
      const getProducts =
        await query(`SELECT p.*,pt.type_name,pm.merk_name FROM products p
      LEFT JOIN product_type pt on pt.product_type_id = p.product_type
      LEFT JOIN product_merk pm on pm.product_merk_id = p.product_merk
      ORDER BY p.created_at DESC
      `);

      return res.status(200).send({
        message: "Get Products Data Success",
        data: getProducts,
      });
    } catch (error) {
      console.error("Products All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  master: async (req, res) => {
    try {
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
        `SELECT product_name
FROM products
ORDER BY stock DESC
LIMIT 1;
`
      );

      return res.status(200).send({
        message: "Get Product Master Data Success",
        data: {
          totalProduct: countTotalProduct[0].totalProduct,
          totalProductMerk: countTotalProductMerk[0].totalProductMerk,
          totalProductType: countTotalProductType[0].totalProductType,
          mostStockProduct: mostStockProduct[0].product_name,
        },
      });
    } catch (error) {
      console.error("Product Master  All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ message: "ID is required" });
      }

      const result = await query(`DELETE FROM products WHERE product_id = ?`, [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Product not found" });
      }

      return res.status(200).send({
        message: "Product deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete Product Error:", error);
      return res.status(500).send({ message: "Failed to delete Product" });
    }
  },
  create: async (req, res) => {
    try {
      const {
        name,
        aklAkd,
        expiredDate,
        price,
        stock,
        productType,
        productMerk,
      } = req.body;

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const errors = [];
      if (!name) {
        errors.push({ field: "name", message: "Name is required" });
      }
      if (!aklAkd) {
        errors.push({ field: "aklAkd", message: "NO AKL/AKD is required" });
      }
      if (!expiredDate) {
        errors.push({
          field: "expiredDate",
          message: "Expired Date is required",
        });
      }
      if (!price) {
        errors.push({ field: "price", message: "Price is required" });
      }

      if (!productType) {
        errors.push({
          field: "productType",
          message: "Product Type is required",
        });
      }
      if (!productMerk) {
        errors.push({
          field: "productMerk",
          message: "Product Merk is required",
        });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      const result = await query(
        `INSERT INTO products (product_name, product_type, product_merk, akl_akd, price, stock , expired_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          productType,
          productMerk,
          aklAkd,
          price,
          stock,
          expiredDate,
          createdDate,
        ]
      );

      return res.status(200).send({
        message: "Product created successfully",
        data: result[0],
      });
    } catch (error) {
      console.error("Create Product Error:", error);
      return res
        .status(500)
        .send({ message: error.message || "Failed to create Product" });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        aklAkd,
        expiredDate,
        price,
        stock,
        productType,
        productMerk,
      } = req.body;
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const errors = [];
      if (!id) {
        errors.push({ field: "id", message: "ID is required" });
      }
      if (!name) {
        errors.push({ field: "name", message: "Name is required" });
      }
      if (!aklAkd) {
        errors.push({ field: "aklAkd", message: "Akl Akd is required" });
      }
      if (!expiredDate) {
        errors.push({
          field: "expiredDate",
          message: "Expired Date is required",
        });
      }
      if (!price) {
        errors.push({ field: "price", message: "Price is required" });
      }

      if (!productType) {
        errors.push({
          field: "productType",
          message: "Product Type is required",
        });
      }
      if (!productMerk) {
        errors.push({
          field: "productMerk",
          message: "Product Merk is required",
        });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      const updateProduct = await query(
        `UPDATE products 
       SET product_name = ?, product_type  = ?, product_merk  = ?, akl_akd  = ?, price  = ?, stock  = ? , expired_date  = ?  , updated_at = ?
       WHERE product_id = ?`,
        [
          name,
          productType,
          productMerk,
          aklAkd,
          price,
          stock,
          expiredDate,
          updatedDate,
          id,
        ]
      );

      if (updateProduct.affectedRows === 0) {
        return res.status(404).send({ message: "Product not found" });
      }

      return res.status(200).send({
        message: "Product updated successfully",
      });
    } catch (error) {
      console.error("Product Update Error:", error);
      res.status(500).send({ message: "Failed to update Product" });
    }
  },
  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const getProduct = await query(
        `SELECT * FROM products
        WHERE product_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Product Detail Success",
        data: getProduct[0],
      });
    } catch (error) {
      console.error("Product Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
