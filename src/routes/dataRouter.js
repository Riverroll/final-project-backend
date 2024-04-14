const express = require("express");
const { dataController } = require("../controllers");

const router = express.Router();

router.post("/", dataController.dataDashboard);
router.post("/user", dataController.dataUser);
router.get("/master/transaction", dataController.masterTransactionForm);

module.exports = router;
