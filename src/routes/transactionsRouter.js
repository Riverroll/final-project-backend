const express = require("express");
const { transactionsController } = require("../controllers");

const router = express.Router();

router.get("/in", transactionsController.getAllTransactionIn);
router.get("/in/:id", transactionsController.getTransactionInDetail);
router.put("/in/:id", transactionsController.updateTransactionIn);
router.post("/in/create", transactionsController.insertTransactionIn);
router.get("/out/list/:id", transactionsController.transactionOutListCustomer);
router.get("/out/list", transactionsController.transactionOutList);
router.post("/out/create", transactionsController.insertTransactionOut);
router.get("/out/detail/:id", transactionsController.transactionOutDetail);
router.put("/out/update/:id", transactionsController.updateTransactionOut);
router.get("/report", transactionsController.transactionReport);

module.exports = router;
