const express = require("express");
const { salesController } = require("../controllers");

const router = express.Router();

router.get("/master", salesController.master);
router.get("/", salesController.all);
router.post("/", salesController.create);
router.delete("/:id", salesController.delete);
router.get("/:id", salesController.detail);
router.put("/:id", salesController.update);

module.exports = router;
