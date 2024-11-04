const authService = require("../services/authService");
const formatResponse = require("../utils/responseFormatter");

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      const response = await authService.registerUser(
        name,
        email,
        password,
        role
      );
      res.status(201).send(formatResponse(201, response.message, null));
    } catch (error) {
      res.status(400).send(formatResponse(400, error.message, null));
    }
  },

  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const response = await authService.loginUser(identifier, password);
      res
        .status(200)
        .send(formatResponse(200, response.message, response.data));
    } catch (error) {
      res.status(400).send(formatResponse(400, error.message, null));
    }
  },

  editUserLate: async (req, res) => {
    try {
      const { user_id, name, email, password, isAdmin } = req.body;
      const response = await authService.editUserLate(
        user_id,
        name,
        email,
        password,
        isAdmin
      );
      res.status(200).send(formatResponse(200, response.message, null));
    } catch (error) {
      res.status(400).send(formatResponse(400, error.message, null));
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      const response = await authService.deleteUser(id);
      res.status(200).send(formatResponse(200, response.message, null));
    } catch (error) {
      res.status(400).send(formatResponse(400, error.message, null));
    }
  },

  fetchUser: async (req, res) => {
    try {
      const { token } = req.body;

      const user = await authService.fetchUser(token);
      res
        .status(200)
        .send(formatResponse(200, "User fetched successfully", user));
    } catch (error) {
      res.status(400).send(formatResponse(400, error.message, null));
    }
  },

  allUser: async (req, res) => {
    try {
      const users = await authService.fetchAllUsers();
      res.status(200).send(formatResponse(200, "Get User Data Success", users));
    } catch (error) {
      res.status(500).send(formatResponse(500, "Internal Server Error", null));
    }
  },

  allRole: async (req, res) => {
    try {
      const roles = await authService.fetchAllRoles();
      res.status(200).send(formatResponse(200, "Get Role Data Success", roles));
    } catch (error) {
      res.status(500).send(formatResponse(500, "Internal Server Error", null));
    }
  },

  resetPasswordUser: async (req, res) => {
    try {
      const { user_id, password } = req.body;
      const response = await authService.resetPasswordUser(user_id, password);
      res.status(200).send(formatResponse(200, response.message, null));
    } catch (error) {
      res.status(400).send(formatResponse(400, error.message, null));
    }
  },

  detailUser: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await authService.getUserById(id);

      if (!user) {
        return res
          .status(404)
          .send(formatResponse(404, "User not found", null));
      }

      res
        .status(200)
        .send(formatResponse(200, "Get User Detail Success", user));
    } catch (error) {
      console.error("User Detail Error:", error);
      res.status(500).send(formatResponse(500, "Internal Server Error", null));
    }
  },

  editUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role_id } = req.body;

      if (!name) {
        return res
          .status(400)
          .send(formatResponse(400, "Name is required", null));
      }
      if (!email) {
        return res
          .status(400)
          .send(formatResponse(400, "Email is required", null));
      }
      if (!role_id) {
        return res
          .status(400)
          .send(formatResponse(400, "Role is required", null));
      }

      const user = await authService.getUserById(id);
      if (!user) {
        return res
          .status(404)
          .send(formatResponse(404, "User not found", null));
      }

      const updatedUser = {
        ...user,
        name,
        email,
        role_id,
      };

      await authService.updateUser(updatedUser);

      res
        .status(200)
        .send(formatResponse(200, "User updated successfully", null));
    } catch (error) {
      console.error("Edit User Error:", error);
      res.status(500).send(formatResponse(500, "Internal Server Error", null));
    }
  },
};
