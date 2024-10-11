const express = require("express");
const { customerController } = require("../controllers");

const router = express.Router();

router.get("/", customerController.all);
router.get("/master/:id", customerController.master);
router.get("/master", customerController.allMaster);
router.post("/", customerController.create);
router.put("/:id", customerController.update);
router.get("/:id", customerController.detail);
router.delete("/:id", customerController.delete);

module.exports = router;
