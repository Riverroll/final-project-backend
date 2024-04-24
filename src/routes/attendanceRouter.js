const express = require("express");
const { attendanceController } = require("../controllers");
const router = express.Router();

router.post("/all", attendanceController.getDataAttendance);
router.post("/list", attendanceController.all);
router.post("/submit", attendanceController.submitAttendance);

module.exports = router;
