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
};
