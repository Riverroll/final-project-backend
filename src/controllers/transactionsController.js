// require("dotenv").config({
//   path: ".env",
// });
require("dotenv").config();
const { pool, query } = require("../database");
const moment = require("moment-timezone");

const env = process.env;

module.exports = {
  transactionInList: async (req, res) => {
    try {
      const getTransactionIn = await query(
        `SELECT ti.*,s.supplier_name,s.supplier_code FROM transaction_in as ti
        LEFT JOIN suppliers as s on s.supplier_id = ti.supplier_id
        ORDER BY ti.created_at DESC
        `
      );

      return res.status(200).send({
        message: "Get All Transaction In Data Success",
        data: getTransactionIn,
      });
    } catch (error) {
      console.error("All Transaction In Error:", error);
      res.status(500).send({ message: error });
    }
  },
  transactionInDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const getTransactionInDetail = await query(
        `SELECT tid.transaction_in_id,tid.transaction_in_detail_id,s.supplier_name,s.supplier_code,p.product_name ,pt.type_name ,pm.merk_name,p.akl_akd,p.price ,p.stock,p.expired_date  FROM transaction_in as ti
        LEFT JOIN suppliers s on s.supplier_id = ti.supplier_id
        LEFT JOIN transaction_in_detail  tid on tid.transaction_in_id = ti.transaction_in_id 
        LEFT JOIN products p on p.product_id = tid.product_id 
        LEFT JOIN product_type pt on p.product_type = pt.product_type_id 
        LEFT JOIN product_merk pm on p.product_merk = pm.product_merk_id 
        WHERE tid.transaction_in_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Transaction In Detail Data Success",
        data: getTransactionInDetail,
      });
    } catch (error) {
      console.error("Transaction In Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  insertTransactionIn: async (req, res) => {
    try {
      const {
        noFaktur,
        note,
        paymentMethod,
        productList,
        supplierId,
        timeToPayment,
      } = req.body;
      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const insertTransaction = await query(
        `INSERT INTO transaction_in (no_faktur, note, payment_method, supplier_id, time_to_payment,created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [noFaktur, note, paymentMethod, supplierId, timeToPayment, createdDate]
      );

      const transactionId = insertTransaction.insertId;

      // for (let product of productList) {
      //   await query(
      //     `INSERT INTO transaction_in_detail (transaction_id, product_name, product_expired, product_qty, product_type, product_brand) VALUES (?, ?, ?, ?, ?, ?)`,
      //     [
      //       transactionId,
      //       product.productName,
      //       product.productExpired,
      //       product.productQty,
      //       product.productType,
      //       product.productBrand,
      //     ]
      //   );
      // }

      for (let product of productList) {
        await query(
          `INSERT INTO transaction_in_detail (transaction_in_id, product_id) VALUES (?, ?)`,
          [transactionId, product.productName]
        );
      }

      return res.status(200).send({
        message: "Data transaksi masuk berhasil disimpan",
        data: insertTransaction,
      });
    } catch (error) {
      console.error("Transaction In Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  transactionOutList: async (req, res) => {
    try {
      const { id } = req.params;
      const getTransactionOut = await query(
        `SELECT tro.*, c.customer_name 
        FROM transaction_out  tro
        LEFT JOIN customers c ON c.customer_id = tro.customer_id
        WHERE tro.customer_id = ${id}
        ORDER BY tro.created_at DESC 
        `
      );

      return res.status(200).send({
        message: "Get All Transaction In Data Success",
        data: getTransactionOut,
      });
    } catch (error) {
      console.error("All Transaction In Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
