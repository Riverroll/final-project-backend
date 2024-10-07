const { query } = require("../database");

const SalesRepository = {
  getAllSales: async () => {
    return await query(`
      SELECT 
          s.*, 
          COALESCE(SUM(tod.amount_tax), 0) AS total_transaction, 
          COALESCE(SUM(tod.amount_cn), 0) AS total_cn
      FROM 
          sales_team s 
      LEFT JOIN 
          transaction_out tod ON s.sales_id = tod.salesman 
      GROUP BY 
          s.sales_id 
      ORDER BY 
          s.sales_name ASC
    `);
  },

  getTotalSalesCount: async () => {
    const countTotalSales = await query(
      `SELECT COUNT(*) AS totalSales FROM sales_team`
    );

    return countTotalSales[0].totalSales;
  },

  createSales: async (salesName, createdDate) => {
    return await query(
      `INSERT INTO sales_team (sales_name, created_at) VALUES (?, ?)`,
      [salesName, createdDate]
    );
  },

  deleteSalesById: async (id) => {
    return await query(`DELETE FROM sales_team WHERE sales_id = ?`, [id]);
  },

  getSalesById: async (id) => {
    return await query(`SELECT * FROM sales_team WHERE sales_id = ?`, [id]);
  },

  updateSalesById: async (salesName, updatedDate, id) => {
    return await query(
      `UPDATE sales_team SET sales_name = ?, updated_at = ? WHERE sales_id = ?`,
      [salesName, updatedDate, id]
    );
  },

  getSalesTransactions: async (id) => {
    return await query(
      `
      SELECT 
          t.*, 
          c.customer_name
      FROM 
          transaction_out t 
      LEFT JOIN 
          customers c ON t.customer_id = c.customer_id 
      WHERE 
          t.salesman = ?
    `,
      [id]
    );
  },
};

module.exports = SalesRepository;
