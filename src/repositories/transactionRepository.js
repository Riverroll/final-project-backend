const { query, pool } = require("../database");

const TransactionRepository = {
  getAllTransactionIn: async () => {
    return await query(`
      SELECT ti.*, s.supplier_name, s.supplier_code, u.name 
      FROM transaction_in AS ti
      LEFT JOIN suppliers AS s ON s.supplier_id = ti.supplier_id
      LEFT JOIN user AS u ON u.user_id = ti.pic
      ORDER BY ti.created_at DESC
    `);
  },

  getTransactionInDetailById: async (transaction_in_id) => {
    return await query(`
      SELECT 
        tid.transaction_in_id,
        tid.transaction_in_detail_id,
        s.supplier_name,
        s.supplier_code,
        p.product_name,
        pt.type_name,
        pm.merk_name,
        p.akl_akd,
        tid.quantity,
        tid.price,
        tid.price_discount,
        tid.discount,
        tid.product_id,
        tid.product_code,
        tid.batch_lot,
        pe.expired_date
      FROM transaction_in AS ti
      LEFT JOIN suppliers s ON s.supplier_id = ti.supplier_id
      LEFT JOIN transaction_in_detail tid ON tid.transaction_in_id = ti.transaction_in_id 
      LEFT JOIN products p ON p.product_id = tid.product_id 
      LEFT JOIN product_type pt ON p.product_type = pt.product_type_id 
      LEFT JOIN product_merk pm ON p.product_merk = pm.product_merk_id 
      LEFT JOIN (
        SELECT product_id, MAX(expired_date) AS expired_date
        FROM product_expired
        WHERE transaction_in_id = ${pool.escape(transaction_in_id)}
        GROUP BY product_id
      ) pe ON p.product_id = pe.product_id
      WHERE tid.transaction_in_id = ${pool.escape(transaction_in_id)}
    `);
  },

  getTransactionInById: async (transaction_in_id) => {
    const result = await query(`
      SELECT transaction_in.*, suppliers.supplier_name, suppliers.supplier_code 
      FROM transaction_in 
      LEFT JOIN suppliers ON suppliers.supplier_id = transaction_in.supplier_id 
      WHERE transaction_in_id = ${pool.escape(transaction_in_id)}
    `);
    return result[0];
  },
};

module.exports = TransactionRepository;
