const express = require("express");
const { customerController } = require("../controllers");

const router = express.Router();

router.get("/all", customerController.all);
router.get("/master/:id", customerController.master);
router.get("/master", customerController.allMaster);
router.post("/create", customerController.create);
router.put("/update/:id", customerController.update);
router.get("/detail/:id", customerController.detail);
router.delete("/delete/:id", customerController.delete);

module.exports = router;
