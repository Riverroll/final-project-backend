require("dotenv").config({
  path: ".env.local",
});
const { db, query } = require("../database");
const jwt = require("jsonwebtoken");

const env = process.env;

module.exports = {
  dataDashboard: async (req, res) => {
    try {
      const { isAdmin, user_id } = req.body;

      let responseData;

      if (isAdmin === 1) {
        // Admin logic to get total user, total attendance, and most frequent user
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
        const totalAttendanceQuery = `SELECT COUNT(*) AS totalAttendance FROM attendance WHERE user_id = ${db.escape(
          user_id
        )}`;
        const totalAttendanceResult = await query(totalAttendanceQuery);

        const lastAttendanceQuery = `SELECT MAX(date) AS lastAttendance FROM attendance WHERE user_id = ${db.escape(
          user_id
        )}`;
        const lastAttendanceResult = await query(lastAttendanceQuery);

        const today = new Date().toISOString().split("T")[0];
        const todayAttendanceQuery = `SELECT COUNT(*) AS todayAttendance FROM attendance WHERE user_id = ${db.escape(
          user_id
        )} AND DATE(date) = '${today}'`;
        const todayAttendanceResult = await query(todayAttendanceQuery);

        const lastLocationQuery = `SELECT location_lat as latitude,location_long as longitude FROM attendance WHERE user_id = ${db.escape(
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

      console.log(responseData);

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
      // const getUser = "SELECT * FROM user";
      // const user = await query(getUser);

      // console.log(user);
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
        LIMIT ${db.escape(items)}
        OFFSET ${db.escape((pages - 1) * items)};
      `;

      // Execute the main query
      const results = await query(sqlQuery, sqlParams);

      // Execute the count query
      const countResult = await query(countQuery, sqlParams);
      const totalCount = countResult[0].totalCount;

      console.log(results);
      console.log(totalCount);
      console.log(countResult);
      console.log(req.body);

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
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
};
