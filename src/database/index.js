// require("dotenv").config({
//   path: ".env",
// });
// const mysql = require("mysql2");
// const util = require("util");
// const env = process.env;

// const db = mysql.createConnection({
//   host: env.MYSQL_HOST,
//   user: env.MYSQL_USER,
//   password: env.MYSQL_PASSWORD,
//   database: env.MYSQL_DB_NAME,
//   port: env.MYSQL_PORT,

//   waitForConnections: true,
//   connectTimeout: 30000,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// // Handle disconnection
// db.on("error", (err) => {
//   if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
//     console.error("MySQL connection lost. Reconnecting...");
//     db.connect((err) => {
//       if (err) {
//         return console.error(`error: ${err.message}`);
//       }
//       console.log("Connected to mysql server");
//     });
//   } else {
//     console.error(`MySQL error: ${err.message}`);
//   }
// });

// db.connect((err) => {
//   if (err) {
//     return console.error(`error: ${err.message}`);
//   }
//   console.log("Connected to mysql server");
// });

// const query = util.promisify(db.query).bind(db);
// module.exports = { db, query };

require("dotenv").config({
  path: ".env",
});
const mysql = require("mysql2");
const util = require("util");
const env = process.env;

// Gunakan createPool untuk menggunakan pooling koneksi
const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DB_NAME,
  port: env.MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Handle disconnection dengan menggunakan pool.getConnection()
pool.on("connection", (connection) => {
  console.log("Connected to MySQL server");

  // Handle disconnection
  connection.on("error", (err) => {
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      console.error("MySQL connection lost. Reconnecting...");
      pool.getConnection((err, connection) => {
        if (err) {
          return console.error(`error: ${err.message}`);
        }
        console.log("Reconnected to MySQL server");
      });
    } else {
      console.error(`MySQL error: ${err.message}`);
    }
  });
});

const query = util.promisify(pool.query).bind(pool);
module.exports = { pool, query };
