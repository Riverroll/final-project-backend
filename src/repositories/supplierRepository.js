const { query } = require("../database");

module.exports = {
  findAllSuppliers: async () => {
    return await query(`SELECT * FROM suppliers ORDER BY created_at DESC`);
  },

  countTotalSuppliers: async () => {
    const result = await query(
      `SELECT COUNT(*) AS totalSuppliers FROM suppliers`
    );
    return result[0].totalSuppliers;
  },

  countTotalTransactions: async () => {
    const result = await query(
      `SELECT COUNT(*) AS totalTransactions FROM transaction_in`
    );
    return result[0].totalTransactions;
  },

  countTodayTransactions: async () => {
    const result = await query(`SELECT COUNT(*) AS totalTodayTransactions 
                                FROM transaction_in 
                                WHERE DATE(created_at) = CURDATE()`);
    return result[0].totalTodayTransactions;
  },

  findMostActiveSupplier: async () => {
    const result = await query(`
      SELECT suppliers.supplier_name, COUNT(transaction_in.supplier_id) AS total_transactions
      FROM transaction_in
      LEFT JOIN suppliers ON suppliers.supplier_id = transaction_in.supplier_id
      GROUP BY transaction_in.supplier_id
      ORDER BY total_transactions DESC
      LIMIT 1;
    `);
    return result.length ? result[0].supplier_name : null;
  },

  findAllMasterSuppliers: async () => {
    return await query(
      `SELECT supplier_id, supplier_name, supplier_code FROM suppliers`
    );
  },

  findAllMasterProducts: async () => {
    return await query(
      `SELECT product_id, product_name, isExpired FROM products`
    );
  },

  findAllMasterProductTypes: async () => {
    return await query(`SELECT product_type_id, type_name FROM product_type`);
  },

  findAllMasterProductMerks: async () => {
    return await query(`SELECT product_merk_id, merk_name FROM product_merk`);
  },

  getLastTransactionNumber: async () => {
    const result = await query(
      `SELECT no_kita FROM transaction_in ORDER BY created_at DESC LIMIT 1`
    );
    return result.length ? result[0].no_kita : null;
  },

  checkSupplierByCode: async (supplierCode) => {
    const result = await query(
      `SELECT COUNT(*) AS count FROM suppliers WHERE supplier_code = ?`,
      [supplierCode]
    );
    return result[0].count;
  },

  createSupplier: async (supplierName, supplierCode, createdAt) => {
    return await query(
      `INSERT INTO suppliers (supplier_name, supplier_code, created_at) VALUES (?, ?, ?)`,
      [supplierName, supplierCode, createdAt]
    );
  },

  deleteSupplierById: async (id) => {
    const result = await query(`DELETE FROM suppliers WHERE supplier_id = ?`, [
      id,
    ]);
    return result.affectedRows > 0;
  },

  findSupplierById: async (id) => {
    const result = await query(
      `SELECT * FROM suppliers WHERE supplier_id = ?`,
      [id]
    );
    return result[0];
  },

  updateSupplier: async (id, supplierName, supplierCode, updatedAt) => {
    const result = await query(
      `UPDATE suppliers 
                                SET supplier_name = ?, supplier_code = ?, updated_at = ? 
                                WHERE supplier_id = ?`,
      [supplierName, supplierCode, updatedAt, id]
    );
    return result.affectedRows > 0;
  },
};
