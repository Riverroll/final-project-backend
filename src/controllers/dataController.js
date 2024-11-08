require("dotenv").config({
  path: ".env",
});
const { pool, query } = require("../database");
const jwt = require("jsonwebtoken");

const env = process.env;

module.exports = {
  dataDashboard: async (req, res) => {
    try {
      const { isAdmin, user_id } = req.body;

      let responseData;

      if (isAdmin === 1) {
        const totalUserQuery = "SELECT COUNT(*) AS totalUsers FROM user";
        const totalUserResult = await query(totalUserQuery);

        const totalAttendanceQuery =
          "SELECT COUNT(*) AS totalAttendance FROM attendance";
        const totalAttendanceResult = await query(totalAttendanceQuery);

        const today = new Date().toISOString().split("T")[0];
        const todayAttendanceQuery = `SELECT COUNT(*) AS todayAttendance FROM attendance WHERE DATE(date) = '${today}'`;
        const todayAttendanceResult = await query(todayAttendanceQuery);

        const mostFrequentUserQuery = `
          SELECT u.name, COUNT(a.user_id) AS attendanceCount
          FROM user u
          LEFT JOIN attendance a ON u.user_id = a.user_id
          GROUP BY u.user_id
          ORDER BY attendanceCount DESC
          LIMIT 1
        `;
        const mostFrequentUserResult = await query(mostFrequentUserQuery);

        responseData = {
          totalUsers: totalUserResult[0].totalUsers,
          totalAttendance: totalAttendanceResult[0].totalAttendance,
          todayAttendance: todayAttendanceResult[0].todayAttendance,
          mostFrequentUser: mostFrequentUserResult[0],
        };
      } else {
        // Non-admin logic to get data based on user_id
        const totalAttendanceQuery = `SELECT COUNT(*) AS totalAttendance FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )}`;
        const totalAttendanceResult = await query(totalAttendanceQuery);

        const lastAttendanceQuery = `SELECT MAX(date) AS lastAttendance FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )}`;
        const lastAttendanceResult = await query(lastAttendanceQuery);

        const today = new Date().toISOString().split("T")[0];
        const todayAttendanceQuery = `SELECT COUNT(*) AS todayAttendance FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )} AND DATE(date) = '${today}'`;
        const todayAttendanceResult = await query(todayAttendanceQuery);

        const lastLocationQuery = `SELECT location_lat as latitude,location_long as longitude FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )} ORDER BY date DESC LIMIT 1`;
        const lastLocationResult = await query(lastLocationQuery);

        responseData = {
          totalAttendance: totalAttendanceResult[0].totalAttendance,
          lastAttendance: lastAttendanceResult[0].lastAttendance,
          todayAttendance: todayAttendanceResult[0].todayAttendance,
          lastLocation: lastLocationResult[0],
        };
      }

      return res.status(200).send({
        message: "Get Dashboard Data Success",
        data: responseData,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  dataUser: async (req, res) => {
    try {
      const { page, itemsPerPage, sortOrder, searchName } = req.body;

      let items = itemsPerPage || 10;
      let pages = page || 1;
      let sqlQuery;
      let countQuery;
      let sqlParams = [];

      sqlQuery = `SELECT * FROM user `;

      countQuery = `
        SELECT 
          COUNT(*) as totalCount
        FROM 
          user
      `;

      if (searchName) {
        sqlQuery += `WHERE user.name LIKE ?  `;
        countQuery += `WHERE user.name LIKE ?  `;
        sqlParams.push(`%${searchName}%`);
      }

      if (sortOrder === "asc") {
        sqlQuery += `
          ORDER BY
          user_id asc
        `;
      } else {
        sqlQuery += `
          ORDER BY
          user_id desc
        `;
      }

      sqlQuery += `
        LIMIT ${pool.escape(items)}
        OFFSET ${pool.escape((pages - 1) * items)};
      `;

      const results = await query(sqlQuery, sqlParams);

      const countResult = await query(countQuery, sqlParams);
      const totalCount = countResult[0].totalCount;

      return res.status(200).send({
        message: "Get Dashboard Data Success",
        data: {
          results,
          totalCount,
          currentPage: pages,
          totalPages: Math.ceil(totalCount / items),
        },
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).send({ message: error });
    }
  },
  masterTransactionForm: async (req, res) => {
    try {
      const masterSupplier = await query(
        `SELECT supplier_id,supplier_name,supplier_code FROM suppliers`
      );
      const masterProduct = await query(
        `SELECT product_id,product_name,price,stock FROM products`
      );
      const masterProductType = await query(
        `SELECT product_type_id,type_name FROM product_type`
      );
      const masterProductMerk = await query(
        `SELECT product_merk_id,merk_name FROM product_merk`
      );
      const masterCustomer = await query(
        `SELECT customer_id,customer_name FROM customers`
      );
      const masterSalesman = await query(
        `SELECT sales_id,sales_name FROM sales_team`
      );

      return res.status(200).send({
        message: "Get Master Transaction Data Success",
        data: {
          supplier: masterSupplier,
          product: masterProduct,
          productType: masterProductType,
          productMerk: masterProductMerk,
          customer: masterCustomer,
          salesman: masterSalesman,
        },
      });
    } catch (error) {
      console.error("Master Transaction Error:", error);
      res.status(500).send({ message: error });
    }
  },
  masterDynamicTransactionForm: async (req, res) => {
    try {
      const { supplier_id } = req.body;
      const masterProduct = await query(
        `SELECT product_id,product_name,price,stock FROM products WHERE supplier_id = '${supplier_id}'`
      );

      return res.status(200).send({
        message: "Get Master Dynamic Transaction Data Success",
        data: {
          product: masterProduct,
        },
      });
    } catch (error) {
      console.error("Master Dynamic Transaction Error:", error);
      res.status(500).send({ message: error });
    }
  },
  dataOperasionalDashboard: async (req, res) => {
    try {
      const countTotalProduct = await query(
        `SELECT COUNT(*) AS totalProduct FROM products`
      );
      const countTotalSupplier = await query(
        `SELECT COUNT(*) AS totalSupplier FROM suppliers`
      );
      const countTotalTransactionIn = await query(
        `SELECT COUNT(*) AS totalTransactionIn FROM transaction_in`
      );
      const countTotalTransactionOut = await query(
        `SELECT COUNT(*) AS totalTransactionOut FROM transaction_out`
      );

      return res.status(200).send({
        message: "Get Dashboard Data Success",
        data: {
          totalProduct: countTotalProduct[0].totalProduct,
          totalSupplier: countTotalSupplier[0].totalSupplier,
          totalTransactionIn: countTotalTransactionIn[0].totalTransactionIn,
          totalTransactionOut: countTotalTransactionOut[0].totalTransactionOut,
        },
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  dataMarketingDashboard: async (req, res) => {
    try {
      const { role_id, user_id } = req.body;

      let responseData;

      if (role_id == 1) {
        const totalUserQuery = "SELECT COUNT(*) AS totalUsers FROM user";
        const totalUserResult = await query(totalUserQuery);

        const totalAttendanceQuery =
          "SELECT COUNT(*) AS totalAttendance FROM attendance";
        const totalAttendanceResult = await query(totalAttendanceQuery);

        const today = new Date().toISOString().split("T")[0];
        const todayAttendanceQuery = `SELECT COUNT(*) AS todayAttendance FROM attendance WHERE DATE(date) = '${today}'`;
        const todayAttendanceResult = await query(todayAttendanceQuery);

        const mostFrequentUserQuery = `
          SELECT u.name, COUNT(a.user_id) AS attendanceCount
          FROM user u
          LEFT JOIN attendance a ON u.user_id = a.user_id
          GROUP BY u.user_id
          ORDER BY attendanceCount DESC
          LIMIT 1
        `;
        const mostFrequentUserResult = await query(mostFrequentUserQuery);

        responseData = {
          totalUsers: totalUserResult[0].totalUsers,
          totalAttendance: totalAttendanceResult[0].totalAttendance,
          todayAttendance: todayAttendanceResult[0].todayAttendance,
          mostFrequentUser: mostFrequentUserResult[0],
        };
      } else {
        // Non-admin logic to get data based on user_id
        const totalAttendanceQuery = `SELECT COUNT(*) AS totalAttendance FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )}`;
        const totalAttendanceResult = await query(totalAttendanceQuery);

        const lastAttendanceQuery = `SELECT MAX(date) AS lastAttendance FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )}`;
        const lastAttendanceResult = await query(lastAttendanceQuery);

        const today = new Date().toISOString().split("T")[0];
        const todayAttendanceQuery = `SELECT COUNT(*) AS todayAttendance FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )} AND DATE(date) = '${today}'`;
        const todayAttendanceResult = await query(todayAttendanceQuery);

        const lastLocationQuery = `SELECT location_lat as latitude,location_long as longitude FROM attendance WHERE user_id = ${pool.escape(
          user_id
        )} ORDER BY date DESC LIMIT 1`;
        const lastLocationResult = await query(lastLocationQuery);

        responseData = {
          totalAttendance: totalAttendanceResult[0].totalAttendance,
          lastAttendance: lastAttendanceResult[0].lastAttendance,
          todayAttendance: todayAttendanceResult[0].todayAttendance,
          lastLocation: lastLocationResult[0],
        };
      }

      return res.status(200).send({
        message: "Get Dashboard Data Success",
        data: responseData,
      });
    } catch (error) {
      console.error("Dashboard Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  masterUser: async (req, res) => {
    try {
      const masterRole = await query(`SELECT * FROM roles`);

      return res.status(200).send({
        message: "Get Master User Data Success",
        data: {
          roles: masterRole,
        },
      });
    } catch (error) {
      console.error("Master User Error:", error);
      res.status(500).send({ message: error });
    }
  },
  userList: async (req, res) => {
    try {
      const users = await query(`SELECT * FROM user`);

      return res.status(200).send({
        message: "Get Master User Data Success",
        data: users,
      });
    } catch (error) {
      console.error("Master User Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
