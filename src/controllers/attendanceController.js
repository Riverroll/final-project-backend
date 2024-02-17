require("dotenv").config({
  path: ".env",
});
const { pool, query } = require("../database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { count } = require("console");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // Folder tempat menyimpan gambar
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "../src/uploads/")); // Folder tempat menyimpan gambar
//   },
//   filename: function (req, file, cb) {
//     const uniqueTimestamp = Date.now();
//     const filename = `${uniqueTimestamp}_${file.originalname}`;
//     cb(null, filename);
//   },
// });
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.resolve(__dirname, "..", "uploads");
      cb(null, uploadPath); // Folder tempat menyimpan gambar
    },
    filename: function (req, file, cb) {
      const uniqueTimestamp = Date.now();
      const originalnameWithoutExtension = path.parse(file.originalname).name;
      const filename = `${originalnameWithoutExtension}_${uniqueTimestamp}${path.extname(
        file.originalname
      )}`;
      cb(null, filename);
    },
  }),
});

// const upload = multer({ storage: storage });

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
            attendance.description
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
            attendance.address
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
      const { address, latitude, longitude, id_user, description } = req.body;
      // const imageFileName = req.file.filename;
      const imageFile = req.file;

      console.log(address, latitude, longitude, id_user, description);

      if (!address || !latitude || !longitude) {
        return res.status(400).json({ message: "Wait location first" });
      }

      if (imageFile.mimetype !== "image/jpeg") {
        return res.status(400).json({ message: "File Type not valid" });
      }
      const uniqueTimestamp = Date.now();
      const fileName = `${uniqueTimestamp}_${imageFile.originalname}.jpg`;
      // Tambahkan tanggal dan waktu saat ini
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split("T")[0];
      const insertQuery = `
      INSERT INTO attendance (address, location_lat, location_long, user_id, description, checkin_photo, date, checkin_time) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

      pool.query(
        insertQuery,
        [
          address,
          latitude,
          longitude,
          id_user,
          description,
          fileName,
          formattedDate,
        ],
        (err, result) => {
          if (err) {
            console.error("Error menyimpan data ke database:", err);
            res.status(500).json({ message: "Gagal menyimpan data di server" });
          } else {
            console.log("Data berhasil disimpan di database");
            fs.renameSync(
              imageFile.path,
              path.join(__dirname, "../../src/uploads", fileName)
            );

            res.json({ message: "Data berhasil disimpan di server" });
          }
        }
      );
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).json({ message: "Gagal menyimpan data di server" });
    }
  },
};
