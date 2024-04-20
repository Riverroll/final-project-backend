const express = require("express");
const { dataController } = require("../controllers");

const router = express.Router();

router.post("/", dataController.dataDashboard);
router.post("/user", dataController.dataUser);
router.get("/master/transaction", dataController.masterTransactionForm);
router.get("/operasional/dashboard", dataController.dataOperasionalDashboard);

module.exports = router;
