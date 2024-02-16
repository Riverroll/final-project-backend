const express = require("express");
const { attendanceController } = require("../controllers");
const multer = require("multer");
const upload = multer({ dest: "src/uploads/" });
const router = express.Router();

router.post("/all", attendanceController.getDataAttendance);
router.post(
  "/submit",
  upload.single("image"),
  attendanceController.submitAttendance
);

module.exports = router;
