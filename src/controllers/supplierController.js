require("dotenv").config();
const { pool, query } = require("../database");
const moment = require("moment-timezone");

const env = process.env;

module.exports = {
  all: async (req, res) => {
    try {
      const getSupllier = await query(
        `SELECT * FROM suppliers
        ORDER BY created_at DESC
        `
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

      const countTotalTransaction = await query(
        `SELECT COUNT(*) AS totalTransaction FROM transaction_in`
      );
      const countTotalTodayTransaction = await query(
        `SELECT COUNT(*) AS totalTodayTransaction 
FROM transaction_in 
WHERE DATE(created_at) = CURDATE();
`
      );
      const countMostSupplierTransaction = await query(
        `SELECT suppliers.supplier_name, COUNT(suppliers.supplier_id) AS total_transactions
FROM transaction_in
LEFT JOIN suppliers ON suppliers.supplier_id = transaction_in.supplier_id
GROUP BY transaction_in.supplier_id
ORDER BY total_transactions DESC
LIMIT 1;
`
      );
      let mostSupplierTransaction = "No transaction found";
      if (countMostSupplierTransaction.length > 0) {
        mostSupplierTransaction = countMostSupplierTransaction[0].supplier_name;
      }

      return res.status(200).send({
        message: "Get Supplier Data Success",
        data: {
          totalSupplier: countTotalSupplier[0].totalSupplier,
          todayTransaction: countTotalTodayTransaction[0].totalTodayTransaction,
          totalTransaction: countTotalTransaction[0].totalTransaction,
          mostSupplierTransaction: mostSupplierTransaction,
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
      const masterProduct = await query(
        `SELECT product_id,product_name,isExpired FROM products`
      );

      const masterProductType = await query(
        `SELECT product_type_id,type_name FROM product_type`
      );
      const masterProductMerk = await query(
        `SELECT product_merk_id,merk_name FROM product_merk`
      );

      const lastTransactionNumber = await getLastTransactionNumber();

      const newTransactionNumber = generateNewTransactionNumber(
        lastTransactionNumber
      );
      return res.status(200).send({
        message: "Get Master Dynamic Data Success",
        data: {
          supplier: masterSupplier,
          product: masterProduct,
          productType: masterProductType,
          productMerk: masterProductMerk,
          transactionNumber: newTransactionNumber,
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
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ message: "ID is required" });
      }

      const result = await query(
        `DELETE FROM suppliers WHERE supplier_id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Distributor not found" });
      }

      return res.status(200).send({
        message: "Distributor deleted successfully",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete Distributor Error:", error);
      return res.status(500).send({ message: "Failed to delete distributor" });
    }
  },
  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const getSupllier = await query(
        `SELECT * FROM suppliers
        WHERE supplier_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Distributor Detail Success",
        data: getSupllier[0],
      });
    } catch (error) {
      console.error("Distributor Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { supplierName, supplierCode } = req.body;
      const uppercaseSupplierCode = supplierCode.toUpperCase();
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const updateSupplier = await query(
        `UPDATE suppliers 
       SET supplier_name = ?, supplier_code = ? , updated_at = ?
       WHERE supplier_id = ?`,
        [supplierName, uppercaseSupplierCode, updatedDate, id]
      );

      if (updateSupplier.affectedRows === 0) {
        return res.status(404).send({ message: "Distributor not found" });
      }

      return res.status(200).send({
        message: "Distributor updated successfully",
      });
    } catch (error) {
      console.error("Distributor Update Error:", error);
      res.status(500).send({ message: "Failed to update Distributor" });
    }
  },
};

const getLastTransactionNumber = async () => {
  const result = await query(
    `SELECT no_kita FROM transaction_in ORDER BY created_at DESC LIMIT 1`
  );
  return result.length ? result[0].no_kita : null;
};

const generateNewTransactionNumber = (lastNumber) => {
  const prefix = "FM-SMS/";
  let newNumber = 1;

  if (lastNumber) {
    const lastNumberInt = parseInt(lastNumber.split("/")[1], 10);
    newNumber = lastNumberInt + 1;
  }

  return `${prefix}${String(newNumber).padStart(3, "0")}`;
};
