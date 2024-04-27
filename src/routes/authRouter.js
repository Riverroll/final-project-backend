const express = require("express");
const { authControllers } = require("../controllers");

const router = express.Router();

router.post("/user", authControllers.fetchUser);
router.post("/login", authControllers.login);
router.post("/register", authControllers.register);
router.put("/update/user", authControllers.editUserLate);
router.delete("/user/delete/:id", authControllers.deleteUser);
router.get("/user/all", authControllers.allUser);
router.get("/role/all", authControllers.allRole);
router.get("/user/detail/:id", authControllers.detailUser);
router.put("/user/update", authControllers.editUser);
router.put("/user/reset/password", authControllers.resetPasswordUser);

module.exports = router;
