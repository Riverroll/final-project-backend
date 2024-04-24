// require("dotenv").config({
//   path: ".env",
// });
require("dotenv").config();
const { pool, query } = require("../database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// const { getIdFromToken } = require("../helper/jwt-payload");

const env = process.env;

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      const existingEmail = await query(
        `SELECT * FROM user WHERE email=${pool.escape(email)}`
      );

      if (existingEmail.length > 0) {
        return res.status(400).send({ message: "Email is already registered" });
      }

      const existingUsername = await query(
        `SELECT * FROM user WHERE name=${pool.escape(name)}`
      );

      if (existingUsername.length > 0) {
        return res
          .status(400)
          .send({ message: "Username is already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await query(`
        INSERT INTO user (name, email, password, role_id)
        VALUES (${pool.escape(name)}, ${pool.escape(email)}, ${pool.escape(
        hashedPassword
      )}, ${pool.escape(role)})
      `);

      res.status(201).send({ message: "User registration successful" });
    } catch (error) {
      console.error("Registration Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier) {
        return res
          .status(400)
          .send({ message: "Please insert the required field first" });
      }

      const user = await query(
        `SELECT * FROM user WHERE email=${pool.escape(
          identifier
        )} OR name=${pool.escape(identifier)}`
      );

      if (user.length === 0) {
        return res.status(400).send({ message: "Email or username not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, user[0].password);

      if (!isPasswordValid) {
        return res
          .status(400)
          .send({ message: "Email/Username or Password is incorrect" });
      }

      const payload = {
        id: user[0].user_id,
      };

      const expiresIn = 60 * 60;

      const expirationTimestamp = Math.floor(Date.now() / 1000) + expiresIn;
      const currentTime = Math.floor(Date.now() / 1000);
      console.log(env.JWT_SECRET);
      const token = jwt.sign(payload, env.JWT_SECRET || "rahasia", {
        expiresIn,
      });
      return res.status(200).send({
        message: "Login Success",
        token,
        data: {
          id: user[0].user_id,
          name: user[0].name,
          email: user[0].email,
          isAdmin: user[0].isAdmin,
          role_id: user[0].role_id,
          expToken: expirationTimestamp,
        },
      });
    } catch (error) {
      console.error("Error in registration:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  editUser: async (req, res) => {
    try {
      const { user_id, name, email, password, isAdmin } = req.body;
      const user = await query(
        `SELECT * FROM user WHERE user_id=${pool.escape(user_id)}`
      );

      if (user.length === 0) {
        return res.status(404).send({ message: "User not found" });
      }

      // const existingEmail = await query(
      //   `SELECT * FROM user WHERE email=${pool.escape(email)}`
      // );

      // if (existingEmail.length > 0) {
      //   return res.status(400).send({ message: "Email is already registered" });
      // }

      // const existingUsername = await query(
      //   `SELECT * FROM user WHERE name=${pool.escape(name)}`
      // );

      // if (existingUsername.length > 0) {
      //   return res
      //     .status(400)
      //     .send({ message: "Username is already registered" });
      // }

      if (name !== undefined) {
        user[0].name = name;
      }

      if (email !== undefined) {
        user[0].email = email;
      }

      if (password !== undefined) {
        if (password !== user[0].password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user[0].password = hashedPassword;
        }
      }

      if (isAdmin !== undefined) {
        user[0].isAdmin = isAdmin;
      }

      await query(
        `UPDATE user SET name=${pool.escape(user[0].name)}, email=${pool.escape(
          user[0].email
        )}, password=${pool.escape(user[0].password)}, isAdmin=${pool.escape(
          user[0].isAdmin
        )} WHERE user_id=${pool.escape(user_id)}`
      );

      return res.status(200).send({ message: "User updated successfully" });
    } catch (error) {
      console.error("Edit User Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { user_id } = req.params;

      // Perhatikan bahwa kita memerlukan ID pengguna untuk mengidentifikasi pengguna yang akan dihapus
      const user = await query(
        `SELECT * FROM user WHERE user_id=${pool.escape(user_id)}`
      );

      if (user.length === 0) {
        return res.status(404).send({ message: "User not found" });
      }

      // Lakukan penghapusan dari database
      await query(`DELETE FROM user WHERE user_id=${pool.escape(user_id)}`);

      // Kirim respons bahwa penghapusan berhasil
      return res.status(200).send({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete User Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  fetchUser: async (req, res) => {
    try {
      const { token } = req.body;

      const decodedToken = jwt.decode(token);

      const user = await query(
        `SELECT * FROM user WHERE user_id=${pool.escape(decodedToken.id)}`
      );

      if (user.length === 0) {
        return res.status(400).send({ message: "User not found" });
      }

      return res.status(200).send({
        message: "Get User Success",
        token,
        data: {
          id: user[0].user_id,
          name: user[0].name,
          email: user[0].email,
          isAdmin: user[0].isAdmin,
          role_id: user[0].role_id,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  allUser: async (req, res) => {
    try {
      const getUser = await query(
        `SELECT user.*, roles.name as role_name FROM user LEFT JOIN roles ON roles.role_id = user.role_id ORDER BY name ASC`
      );

      return res.status(200).send({
        message: "Get User Data Success",
        data: getUser,
      });
    } catch (error) {
      console.error("User All Error:", error);
      res.status(500).send({ message: error });
    }
  },
  allRole: async (req, res) => {
    try {
      const getRole = await query(`SELECT * FROM roles ORDER BY name ASC`);

      return res.status(200).send({
        message: "Get Role Data Success",
        data: getRole,
      });
    } catch (error) {
      console.error("Role All Error:", error);
      res.status(500).send({ message: error });
    }
  },
};
