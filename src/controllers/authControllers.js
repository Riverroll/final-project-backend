require("dotenv").config({
  path: ".env",
});
const { db, query } = require("../database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// const { getIdFromToken } = require("../helper/jwt-payload");

const env = process.env;

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // Lakukan validasi yang diperlukan

      // Check apakah email sudah terdaftar
      const existingUser = await query(
        `SELECT * FROM user WHERE email=${db.escape(email)}`
      );

      if (existingUser.length > 0) {
        return res.status(400).send({ message: "Email sudah terdaftar" });
      }

      // Hash password menggunakan bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user baru ke database
      await query(`
        INSERT INTO user (name, email, password, isAdmin)
        VALUES (${db.escape(name)}, ${db.escape(email)}, ${db.escape(
        hashedPassword
      )}, ${db.escape(role)})
      `);

      res.status(201).send({ message: "Pendaftaran pengguna berhasil" });
    } catch (error) {
      console.error("Error Pendaftaran:", error);
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
      // Cari pengguna berdasarkan email atau username
      const user = await query(
        `SELECT * FROM user WHERE email=${db.escape(
          identifier
        )} OR name=${db.escape(identifier)}`
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
      const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn });
      return res.status(200).send({
        message: "Login Success",
        token,
        data: {
          id: user[0].user_id,
          name: user[0].name,
          email: user[0].email,
          isAdmin: user[0].isAdmin,
          expToken: expirationTimestamp,
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  editUser: async (req, res) => {
    try {
      const { user_id, name, email, password, isAdmin } = req.body;
      console.log(isAdmin);

      // Perhatikan bahwa kita memerlukan ID pengguna untuk mengidentifikasi pengguna yang akan diubah
      const user = await query(
        `SELECT * FROM user WHERE user_id=${db.escape(user_id)}`
      );

      if (user.length === 0) {
        return res.status(404).send({ message: "User not found" });
      }

      // Di sini kita melakukan update hanya jika nilai yang diberikan tidak kosong
      if (name !== undefined) {
        user[0].name = name;
      }

      if (email !== undefined) {
        user[0].email = email;
      }

      if (password !== undefined) {
        // Memeriksa apakah password baru sama dengan password di database

        if (password !== user[0].password) {
          // Jika password berbeda, hash password baru
          const hashedPassword = await bcrypt.hash(password, 10);
          user[0].password = hashedPassword;
        }
      }

      if (isAdmin !== undefined) {
        user[0].isAdmin = isAdmin;
      }

      // Lakukan update ke dalam database
      await query(
        `UPDATE user SET name=${db.escape(user[0].name)}, email=${db.escape(
          user[0].email
        )}, password=${db.escape(user[0].password)}, isAdmin=${db.escape(
          user[0].isAdmin
        )} WHERE user_id=${db.escape(user_id)}`
      );

      // Kirim respons bahwa update berhasil
      return res.status(200).send({ message: "User updated successfully" });
    } catch (error) {
      console.error("Edit User Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { user_id } = req.params;
      console.log(user_id);
      // Perhatikan bahwa kita memerlukan ID pengguna untuk mengidentifikasi pengguna yang akan dihapus
      const user = await query(
        `SELECT * FROM user WHERE user_id=${db.escape(user_id)}`
      );

      if (user.length === 0) {
        return res.status(404).send({ message: "User not found" });
      }

      // Lakukan penghapusan dari database
      await query(`DELETE FROM user WHERE user_id=${db.escape(user_id)}`);

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
        `SELECT * FROM user WHERE user_id=${db.escape(decodedToken.id)}`
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
        },
      });
    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
};
