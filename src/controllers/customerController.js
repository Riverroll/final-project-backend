// require("dotenv").config({
//   path: ".env",
// });
require("dotenv").config();
const { pool, query } = require("../database");

const env = process.env;

module.exports = {
  all: async (req, res) => {
    try {
      let sqlQuery = `SELECT * FROM customers `;

      const getCustomer = await query(`SELECT * FROM customers`);
      const getCountCustomer = await query(
        `SELECT COUNT(*) AS totalCustomers FROM customers`
      );

      return res.status(200).send({
        message: "Get Customer Data Success",
        data: getCustomer,
        total: getCountCustomer[0].totalCustomers,
      });
    } catch (error) {
      console.error("Customer All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  master: async (req, res) => {
    try {
      const { id } = req.params;

      const countTotalTransaction = await query(
        `SELECT COUNT(*) AS totalTransaction FROM transaction_out
        WHERE customer_id = ${id}`
      );

      const countTotalTodayTransaction = await query(
        `SELECT COUNT(*) AS totalTodayTransaction 
FROM transaction_out 
WHERE DATE(created_at) = CURDATE() AND customer_id = ${id};
`
      );

      const customerName = await query(
        `SELECT customer_name FROM customers WHERE customer_id = ${id};`
      );

      return res.status(200).send({
        message: "Get Customer Data Success",
        data: {
          customerName: customerName[0].customer_name,
          todayTransaction: countTotalTodayTransaction[0].totalTodayTransaction,
          totalTransaction: countTotalTransaction[0].totalTransaction,
        },
      });
    } catch (error) {
      console.error("Customer All Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
