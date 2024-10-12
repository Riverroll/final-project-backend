const authRepository = require("../repositories/authRepository");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = process.env;

module.exports = {
  registerUser: async (name, email, password, role) => {
    if (!name || !email || !password || !role) {
      throw new Error("All fields are required");
    }

    const existingEmail = await authRepository.findUserByEmail(email);
    if (existingEmail.length > 0) {
      throw new Error("Email is already registered");
    }

    const existingUsername = await authRepository.findUserByName(name);
    if (existingUsername.length > 0) {
      throw new Error("Username is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await authRepository.createUser(name, email, hashedPassword, role);
    return { message: "User registration successful" };
  },

  loginUser: async (identifier, password) => {
    if (!identifier || !password) {
      throw new Error("Identifier and password are required");
    }

    const user = await authRepository.findUserByIdentifier(identifier);
    if (user.length === 0) {
      throw new Error("Email or username not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      throw new Error("Email/Username or Password is incorrect");
    }

    const payload = { id: user[0].user_id };
    const token = jwt.sign(payload, env.JWT_SECRET || "rahasia", {
      expiresIn: "1h",
    });
    const expirationTimestamp = Math.floor(Date.now() / 1000) + 3600;

    return {
      message: "Login Success",

      data: {
        token,
        id: user[0].user_id,
        name: user[0].name,
        email: user[0].email,
        isAdmin: user[0].isAdmin,
        role_id: user[0].role_id,
        expToken: expirationTimestamp,
      },
    };
  },

  editUserLate: async (userId, name, email, password, isAdmin) => {
    const user = await authRepository.findUserById(userId);
    if (user.length === 0) {
      throw new Error("User not found");
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : user[0].password;
    await authRepository.updateUser(
      userId,
      name || user[0].name,
      email || user[0].email,
      hashedPassword,
      user[0].role_id,
      isAdmin
    );

    return { message: "User updated successfully" };
  },

  deleteUser: async (userId) => {
    const user = await authRepository.findUserById(userId);
    if (user.length === 0) {
      throw new Error("User not found");
    }

    await authRepository.deleteUser(userId);
    return { message: "User deleted successfully" };
  },

  fetchUser: async (token) => {
    const decodedToken = jwt.decode(token);
    if (!decodedToken || !decodedToken.id) {
      return res.status(400).send({ message: "Invalid token" });
    }
    const user = await authRepository.getUserDetail(decodedToken.id);
    if (user.length === 0) {
      throw new Error("User not found");
    }

    return user[0];
  },

  fetchAllUsers: async () => {
    const users = await authRepository.getAllUsers();
    return users;
  },

  fetchAllRoles: async () => {
    const roles = await authRepository.getAllRoles();
    return roles;
  },

  resetPasswordUser: async (userId, password) => {
    const user = await authRepository.findUserById(userId);
    if (user.length === 0) {
      throw new Error("User not found");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await authRepository.updatePassword(userId, hashedPassword);
    return { message: "Password reset successfully" };
  },
  getUserById: async (id) => {
    return await authRepository.findUserById(id);
  },

  updateUser: async (user) => {
    await authRepository.updateUser(user);
  },
};
