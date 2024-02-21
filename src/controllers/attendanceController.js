require("dotenv").config({
  path: ".env",
});
const { pool, query } = require("../database");
const moment = require("moment-timezone");
const env = process.env;

module.exports = {
  getDataAttendance: async (req, res) => {
    try {
      const { isAdmin, user_id, page, itemsPerPage, sortOrder, searchName } =
        req.body;

      let items = itemsPerPage || 10;
      let pages = page || 1;
      let sqlQuery;
      let countQuery;
      let sqlParams = [];

      if (isAdmin === 1) {
        sqlQuery = `
          SELECT 
            attendance.user_id,
            user.name,
            attendance.checkin_time,
            attendance.location_lat,
            attendance.location_long,
            attendance.checkin_photo,
            attendance.date,
            attendance.address,
            attendance.description,
            attendance.checkin_signature,
            attendance.product_desc
            FROM 
            attendance
          INNER JOIN 
            user ON attendance.user_id = user.user_id
        `;

        countQuery = `
          SELECT 
            COUNT(*) as totalCount
          FROM 
            attendance
          INNER JOIN 
            user ON attendance.user_id = user.user_id
        `;

        if (searchName) {
          sqlQuery += `WHERE user.name LIKE ?  `;
          countQuery += `WHERE user.name LIKE ?  `;
          sqlParams.push(`%${searchName}%`);
        }

        if (sortOrder === "asc") {
          sqlQuery += `
            ORDER BY
            attendance.date asc
          `;
        } else {
          sqlQuery += `
            ORDER BY
            attendance.date desc
          `;
        }

        // Tambahkan LIMIT dan OFFSET untuk pagination
        sqlQuery += `
          LIMIT ${pool.escape(items)}
          OFFSET ${pool.escape((pages - 1) * items)};
        `;
      } else {
        sqlQuery = `
          SELECT 
            attendance.user_id,
            user.name,
            attendance.checkin_time,
            attendance.location_lat,
            attendance.location_long,
            attendance.checkin_photo,
            attendance.date,
            attendance.description,
            attendance.address,
            attendance.checkin_signature,
            attendance.product_desc
          FROM 
            attendance
          INNER JOIN 
            user ON attendance.user_id = user.user_id
        `;

        countQuery = `
          SELECT 
            COUNT(*) as totalCount
          FROM 
            attendance
          INNER JOIN 
            user ON attendance.user_id = user.user_id
        `;

        if (searchName) {
          sqlQuery += `WHERE user.name LIKE ?  `;
          countQuery += `WHERE user.name LIKE ?  `;
          sqlParams.push(`%${searchName}%`);
        }

        sqlQuery += ` AND attendance.user_id = ${pool.escape(user_id)}`;

        countQuery += ` AND attendance.user_id = ${pool.escape(user_id)}`;

        if (sortOrder === "asc") {
          sqlQuery += `
            ORDER BY
            attendance.date asc
          `;
        } else {
          sqlQuery += `
            ORDER BY
            attendance.date desc
          `;
        }

        // Tambahkan LIMIT dan OFFSET untuk pagination
        sqlQuery += `
          LIMIT ${pool.escape(items)}
          OFFSET ${pool.escape((pages - 1) * items)};
        `;
      }

      // Execute the main query
      const results = await query(sqlQuery, sqlParams);

      // Execute the count query
      const countResult = await query(countQuery, sqlParams);
      const totalCount = countResult[0].totalCount;
      return res.status(200).send({
        message: "Get User Success",
        data: {
          results,
          totalCount,
          currentPage: pages,
          totalPages: Math.ceil(totalCount / items),
        },
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(error.status || 500).send(error);
    }
  },
  submitAttendance: async (req, res) => {
    try {
      // Proses menyimpan data ke database
      const {
        address,
        latitude,
        longitude,
        id_user,
        description,
        imageUrl,
        signatureUrl,
        product,
      } = req.body;

      if (!latitude || !longitude) {
        res
          .status(500)
          .json({ message: "Please wait for location information first" });
      }

      const currentDate = moment().tz("Asia/Jakarta"); // Set zona waktu ke WIB
      const formattedDate = currentDate.format("YYYY-MM-DD");
      const formattedTime = currentDate.format("HH:mm:ss");
      const insertQuery = `
      INSERT INTO attendance (address, location_lat, location_long, user_id, description, checkin_photo, date, checkin_time, checkin_signature, product_desc) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      pool.query(
        insertQuery,
        [
          address,
          latitude,
          longitude,
          id_user,
          description,
          imageUrl,
          formattedDate,
          formattedTime,
          signatureUrl,
          product,
        ],
        (err, result) => {
          if (err) {
            console.error("Error saving data to the database:", err);
            res
              .status(500)
              .json({ message: "Failed to save data on the server" });
          } else {
            console.log("Data successfully saved to the database");
            res.json({ message: "Data successfully saved on the server" });
          }
        }
      );
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ message: "Failed to save data on the server" });
    }
  },
};
