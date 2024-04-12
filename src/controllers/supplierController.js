// require("dotenv").config({
//   path: ".env",
// });
require("dotenv").config();
const { pool, query } = require("../database");
const moment = require("moment-timezone");

const env = process.env;

module.exports = {
  all: async (req, res) => {
    try {
      const getSupllier = await query(
        `SELECT *, supplier_id AS id FROM suppliers;`
      );

      return res.status(200).send({
        message: "Get Supplier Data Success",
        data: getSupllier,
      });
    } catch (error) {
      console.error("Supplier All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  master: async (req, res) => {
    try {
      const countTotalSupplier = await query(
        `SELECT COUNT(*) AS totalSupplier FROM suppliers`
      );
      return res.status(200).send({
        message: "Get Supplier Data Success",
        data: {
          totalSupplier: countTotalSupplier[0].totalSupplier,
        },
      });
    } catch (error) {
      console.error("Supplier All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  masterDynamic: async (req, res) => {
    try {
      const masterSupplier = await query(
        `SELECT supplier_id,supplier_name,supplier_code FROM suppliers`
      );
      return res.status(200).send({
        message: "Get Master Dynamic Data Success",
        data: {
          supplier: masterSupplier,
        },
      });
    } catch (error) {
      console.error("Supplier All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  create: async (req, res) => {
    try {
      const { supplierName, supplierCode } = req.body;

      const existingSupplier = await query(
        `SELECT COUNT(*) AS count FROM suppliers WHERE UPPER(supplier_code) = ?`,
        [supplierCode.toUpperCase()]
      );

      if (existingSupplier[0].count > 0) {
        return res
          .status(400)
          .send({ message: "Supplier code already exists" });
      }
      const uppercaseSupplierCode = supplierCode.toUpperCase();
      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const result = await query(
        `INSERT INTO suppliers (supplier_name, supplier_code, created_at) VALUES (?, ?, ?)`,
        [supplierName, uppercaseSupplierCode, createdDate]
      );

      return res.status(200).send({
        message: "Distributor created successfully",
        data: {
          supplierId: result.insertId,
          supplierName,
          supplierCode: uppercaseSupplierCode,
          createdDate,
        },
      });
    } catch (error) {
      console.error("Create Distributor Error:", error);
      return res
        .status(500)
        .send({ message: error.message || "Failed to create Distributor" });
    }
  },
};
