const express = require("express");
const { authController } = require("../controllers");

const router = express.Router();

router.post("/user", authController.fetchUser);
router.post("/login", authController.login);
router.post("/register", authController.register);
router.put("/update/user", authController.editUserLate);
router.delete("/user/:id", authController.deleteUser);
router.get("/user", authController.allUser);
router.get("/role", authController.allRole);
router.get("/user/:id", authController.detailUser);
router.put("/user/:id", authController.editUser);
router.put("/user/reset/password", authController.resetPasswordUser);

module.exports = router;
