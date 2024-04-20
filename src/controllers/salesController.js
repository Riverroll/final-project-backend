const { pool, query } = require("../database");
const moment = require("moment-timezone");

module.exports = {
  all: async (req, res) => {
    try {
      const getSales = await query(
        `SELECT * FROM sales_team ORDER BY sales_name ASC`
      );

      return res.status(200).send({
        message: "Get Sales Data Success",
        data: getSales,
      });
    } catch (error) {
      console.error("Sales All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  master: async (req, res) => {
    try {
      const countTotalSales = await query(
        `SELECT COUNT(*) AS totalSales FROM sales_team`
      );

      return res.status(200).send({
        message: "Get Sales Data Success",
        data: {
          totalSales: countTotalSales[0].totalSales,
        },
      });
    } catch (error) {
      console.error("Sales All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  create: async (req, res) => {
    try {
      const { salesName } = req.body;

      const errors = [];
      if (!salesName) {
        errors.push({ field: "name", message: "Name is required" });
      }

      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }

      const createdDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");

      const result = await query(
        `INSERT INTO sales_team (sales_name, created_at) VALUES (?, ?)`,
        [salesName, createdDate]
      );

      return res.status(200).send({
        message: "Sales created successfully",
      });
    } catch (error) {
      console.error("Sales All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).send({ message: "ID is required" });
      }

      const result = await query(`DELETE FROM sales_team WHERE sales_id = ?`, [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Sales not found" });
      }

      return res.status(200).send({
        message: "Sales deleted successfully",
      });
    } catch (error) {
      console.error("Delete Sales Error:", error);
      return res.status(500).send({ message: "Failed to delete Sales" });
    }
  },
  detail: async (req, res) => {
    try {
      const { id } = req.params;
      const getSales = await query(
        `SELECT * FROM sales_team
        WHERE sales_id = ${id}
        `
      );

      return res.status(200).send({
        message: "Get Sales Detail Success",
        data: getSales[0],
      });
    } catch (error) {
      console.error("Sales Detail Error:", error);
      res.status(500).send({ message: error });
    }
  },
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { salesName } = req.body;
      const updatedDate = moment
        .tz("Asia/Jakarta")
        .format("YYYY-MM-DD HH:mm:ss");
      const errors = [];
      if (!salesName) {
        errors.push({ field: "name", message: "Sales Name is required" });
      }
      if (errors.length > 0) {
        return res.status(400).send({ errors });
      }
      const updateSales = await query(
        `UPDATE sales_team 
       SET sales_name = ? , updated_at = ?
       WHERE sales_id = ?`,
        [salesName, updatedDate, id]
      );

      if (updateSales.affectedRows === 0) {
        return res.status(404).send({ message: "Sales not found" });
      }

      return res.status(200).send({
        message: "Sales updated successfully",
      });
    } catch (error) {
      console.error("Sales Update Error:", error);
      res.status(500).send({ message: "Failed to update Sales" });
    }
  },
};
