require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors = require("cors");
const { join } = require("path");
const {
  authRoutes,
  customerRouter,
  supplierRouter,
  transactionsRouter,
  productRouter,
  attendanceRouter,
  dataRouter,
  salesRouter,
} = require("./routes");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(
  cors({
    origin: "*",
    // credentials: true,
  })
);
app.use(express.json());

// API ROUTES
// ===========================
// NOTE : Add your routes here

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRouter);
app.use("/api/data", dataRouter);
app.use("/api/customer", customerRouter);
app.use("/api/supplier", supplierRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/products", productRouter);
app.use("/api/sales", salesRouter);

app.get("/api", (req, res) => {
  res.send(`Hello, this is Sehat Murni Sejahtera API`);
});

app.get("/", (req, res, next) => {
  res.status(200).json({
    message: "Hello, this is Sehat Murni Sejahtera API!",
    availableAPIs: [
      "/api/auth",
      "/api/attendance",
      "/api/data",
      "/api/customer",
      "/api/supplier",
      "/api/transactions",
      "/api/product",
    ],
  });
});

// ===========================

// not found
app.use((req, res, next) => {
  if (req.path.includes("/api/")) {
    res.status(404).send("Not found !");
  } else {
    next();
  }
});

// error
app.use((err, req, res, next) => {
  if (req.path.includes("/api/")) {
    console.error("Error : ", err.stack);
    res.status(500).send("Error !");
  } else {
    next();
  }
});

//#region CLIENT
const clientPath = "../../client/build";
app.use(express.static(join(__dirname, clientPath)));

// Serve the HTML page
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, clientPath, "index.html"));
});

app.listen(PORT, (err) => {
  if (err) {
    console.log(`ERROR: ${err}`);
  } else {
    console.log(`APP RUNNING at ${PORT} ✅`);
  }
});
