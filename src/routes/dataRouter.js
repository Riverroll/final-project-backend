const express = require("express");
const { dataController } = require("../controllers");

const router = express.Router();

router.post("/", dataController.dataDashboard);
router.post("/user", dataController.dataUser);
router.get("/master/transaction", dataController.masterTransactionForm);
router.get("/operasional/dashboard", dataController.dataOperasionalDashboard);
router.post("/marketing/dashboard", dataController.dataMarketingDashboard);
router.get("/master/users", dataController.masterUser);
router.get("/users", dataController.userList);

module.exports = router;
