const express = require("express");
const { transactionsController } = require("../controllers");

const router = express.Router();

router.get("/in/list", transactionsController.transactionInList);
router.get("/in/detail/:id", transactionsController.transactionInDetail);
router.post("/in/create", transactionsController.insertTransactionIn);
router.get("/out/list/:id", transactionsController.transactionOutList);

module.exports = router;
