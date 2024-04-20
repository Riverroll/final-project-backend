const express = require("express");
const { transactionsController } = require("../controllers");

const router = express.Router();

router.get("/in/list", transactionsController.transactionInList);
router.get("/in/detail/:id", transactionsController.transactionInDetail);
router.post("/in/create", transactionsController.insertTransactionIn);
router.get("/out/list/:id", transactionsController.transactionOutList);
router.post("/out/create", transactionsController.insertTransactionOut);
router.get("/out/detail/:id", transactionsController.transactionOutDetail);
router.get("/out/report", transactionsController.transactionOutChrt);

module.exports = router;
