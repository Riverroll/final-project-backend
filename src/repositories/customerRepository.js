const { query } = require("../database");

const customerRepository = {
  getAllCustomers: async () => {
    return await query(`SELECT * FROM customers ORDER BY customer_name ASC`);
  },

  countCustomers: async () => {
    return await query(`SELECT COUNT(*) AS totalCustomers FROM customers`);
  },

  getCustomerById: async (id) => {
    return await query(`SELECT * FROM customers WHERE customer_id = ?`, [id]);
  },

  createCustomer: async (customerName, createdDate) => {
    return await query(
      `INSERT INTO customers (customer_name, created_at) VALUES (?, ?)`,
      [customerName, createdDate]
    );
  },

  updateCustomer: async (id, customerName, updatedDate) => {
    return await query(
      `UPDATE customers SET customer_name = ?, updated_at = ? WHERE customer_id = ?`,
      [customerName, updatedDate, id]
    );
  },

  deleteCustomer: async (id) => {
    return await query(`DELETE FROM customers WHERE customer_id = ?`, [id]);
  },

  countCustomerTransactions: async (id) => {
    return await query(
      `SELECT COUNT(*) AS totalTransaction FROM transaction_out WHERE customer_id = ?`,
      [id]
    );
  },

  countTodayCustomerTransactions: async (id) => {
    return await query(
      `SELECT COUNT(*) AS totalTodayTransaction FROM transaction_out WHERE DATE(created_at) = CURDATE() AND customer_id = ?`,
      [id]
    );
  },

  countAllTransactions: async () => {
    return await query(
      `SELECT COUNT(*) AS totalTransaction FROM transaction_out`
    );
  },

  countTodayTransactions: async () => {
    return await query(
      `SELECT COUNT(*) AS totalTodayTransaction FROM transaction_out WHERE DATE(created_at) = CURDATE()`
    );
  },
};

module.exports = customerRepository;
