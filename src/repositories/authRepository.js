const { pool, query } = require("../database");

module.exports = {
  findUserByEmail: async (email) => {
    return await query(`SELECT * FROM user WHERE email=${pool.escape(email)}`);
  },

  findUserByName: async (name) => {
    return await query(`SELECT * FROM user WHERE name=${pool.escape(name)}`);
  },

  findUserById: async (userId) => {
    return await query(
      `SELECT * FROM user WHERE user_id=${pool.escape(userId)}`
    );
  },

  findUserByIdentifier: async (identifier) => {
    return await query(
      `SELECT * FROM user WHERE email=${pool.escape(
        identifier
      )} OR name=${pool.escape(identifier)}`
    );
  },

  getAllUsers: async () => {
    return await query(
      `SELECT user.*, roles.name as role_name FROM user LEFT JOIN roles ON roles.role_id = user.role_id ORDER BY name ASC`
    );
  },

  getAllRoles: async () => {
    return await query(`SELECT * FROM roles ORDER BY name ASC`);
  },

  createUser: async (name, email, password, role) => {
    return await query(`
      INSERT INTO user (name, email, password, role_id)
      VALUES (${pool.escape(name)}, ${pool.escape(email)}, ${pool.escape(
      password
    )}, ${pool.escape(role)})
    `);
  },

  updateUser: async (userId, name, email, password, role, isAdmin) => {
    return await query(
      `UPDATE user SET name=${pool.escape(name)}, email=${pool.escape(
        email
      )}, password=${pool.escape(password)}, role_id=${pool.escape(
        role
      )}, isAdmin=${pool.escape(isAdmin)}
       WHERE user_id=${pool.escape(userId)}`
    );
  },

  deleteUser: async (userId) => {
    return await query(`DELETE FROM user WHERE user_id=${pool.escape(userId)}`);
  },

  updatePassword: async (userId, password) => {
    return await query(
      `UPDATE user SET password=${pool.escape(
        password
      )} WHERE user_id=${pool.escape(userId)}`
    );
  },

  getUserDetail: async (userId) => {
    return await query(
      `SELECT * FROM user WHERE user_id=${pool.escape(userId)}`
    );
  },
  findUserById: async (id) => {
    const result = await query(`SELECT * FROM user WHERE user_id = ?`, [id]);
    return result.length > 0 ? result[0] : null;
  },

  updateUser: async (user) => {
    const { user_id, name, email, role_id } = user;
    await query(
      `UPDATE user SET name = ?, email = ?, role_id = ? WHERE user_id = ?`,
      [name, email, role_id, user_id]
    );
  },
};
