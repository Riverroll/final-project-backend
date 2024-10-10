require("dotenv").config({ path: "../../.env" });

const mysql = require("mysql2");
const util = require("util");
const env = process.env;
// console.log(process.env.MYSQL_HOST);
// console.log(process.env.MYSQL_USER);
// console.log(process.env.MYSQL_PASSWORD);
// console.log(process.env.MYSQL_DB_NAME, "dv");
// Gunakan createPool untuk menggunakan pooling koneksi
const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DB_NAME,
  port: env.MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 20, // Adjust as needed based on server capacity
  queueLimit: 100, // Limit waiting requests in the queue
  connectTimeout: 60000, // 10 seconds timeout for connecting
  // acquireTimeout: 30000, // Timeout for acquiring a connection from the pool
});

// Handle disconnection dengan menggunakan pool.getConnection()
pool.on("connection", (connection) => {
  console.log("Connected to MySQL server");

  // Handle disconnection
  connection.on("error", (err) => {
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      console.log(err.code);
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
