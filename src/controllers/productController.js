// require("dotenv").config({
//   path: ".env",
// });
require("dotenv").config();
const { pool, query } = require("../database");

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
};
