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
};
