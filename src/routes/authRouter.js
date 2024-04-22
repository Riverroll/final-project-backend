const express = require("express");
const { authControllers } = require("../controllers");

const router = express.Router();

router.post("/user", authControllers.fetchUser);
router.post("/login", authControllers.login);
router.post("/register", authControllers.register);
router.put("/update/user", authControllers.editUser);
router.delete("/delete/user/:user_id", authControllers.deleteUser);
router.get("/user/all", authControllers.allUser);
router.get("/role/all", authControllers.allRole);

module.exports = router;
