const { pool, query } = require("../database");
const moment = require("moment-timezone");

module.exports = {
  all: async (req, res) => {
    try {
      const getCustomer = await query(
        `SELECT * FROM customers ORDER BY customer_name ASC`
      );
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
  create: async (req, res) => {
    try {
      const { customerName } = req.body;

      const errors = [];
      if (!customerName) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const result = await query(
        `INSERT INTO customers (customer_name, created_at) VALUES (?, ?)`,
        [customerName, createdDate]
      );

      return res.status(200).send({
        message: "Customer created successfully",
      });
    } catch (error) {
      console.error("Customer All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ message: "ID is required" });
      }

      const result = await query(
        `DELETE FROM customers WHERE customer_id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Customer not found" });
      }

      return res.status(200).send({
        message: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Delete Customer Error:", error);
      return res.status(500).send({ message: "Failed to delete Customer" });
    }
  },
  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const getCustomer = await query(
        `SELECT * FROM customers
        WHERE customer_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Customer Detail Success",
        data: getCustomer[0],
      });
    } catch (error) {
      console.error("Customer Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { customerName } = req.body;
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const errors = [];
      if (!customerName) {
        errors.push({ field: "name", message: "Customer Name is required" });
      }
      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }
      const updateCustomer = await query(
        `UPDATE customers 
       SET customer_name = ? , updated_at = ?
       WHERE customer_id = ?`,
        [customerName, updatedDate, id]
      );

      if (updateCustomer.affectedRows === 0) {
        return res.status(404).send({ message: "Customer not found" });
      }

      return res.status(200).send({
        message: "Customer updated successfully",
      });
    } catch (error) {
      console.error("Customer Update Error:", error);
      res.status(500).send({ message: "Failed to update Customer" });
    }
  },
};
