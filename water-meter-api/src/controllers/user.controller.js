import bcrypt from "bcryptjs";

import pool from "../db.js";

export async function getAllUsers(req, res) {
  try {
    const { role, search, status } = req.query;

    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role_id,
        ur.title as role_name,
        u.status,
        u.created_at
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by role
    if (role) {
      query += " AND role_id = ?";
      params.push(role);
    }

    // Filter by status
    if (status !== undefined) {
      query += " AND status = ?";
      params.push(status);
    }

    // Search
    if (search) {
      query += `
        AND (
          username LIKE ?
          OR email LIKE ?
        )
      `;

      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY id DESC";

    const [rows] = await pool.query(query, params);

    res.json({
      error: 0,
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 1,
      message: "Server error.",
    });
  }
}

// DELETE USER
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 1,
        message: "User not found.",
      });
    }

    res.json({
      error: 0,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 1,
      message: "Server error.",
    });
  }
}

// CREATE USER OR UPDATE USER
export async function createOrUpdateUser(req, res) {
  try {
    const { id, username, email, password, role_id, status } = req.body;

    // VALIDATION
    if (!username || !email || !role_id) {
      return res.status(400).json({
        error: 1,
        message: "Username, email and role are required.",
      });
    }

    // UPDATE USER
    if (id) {
      const [existingUser] = await pool.query(
        "SELECT * FROM users WHERE id = ?",
        [id]
      );

      if (existingUser.length === 0) {
        return res.status(404).json({
          error: 1,
          message: "User not found.",
        });
      }

      let query = `
        UPDATE users
        SET username = ?, email = ?, role_id = ?, status = ?
      `;

      const params = [username, email, role_id, status ?? 1];

      // Update password only if provided
      if (password) {
        query += `, password = ?`;
        params.push(await bcrypt.hash(password, 10));
      }

      query += ` WHERE id = ?`;
      params.push(id);

      await pool.query(query, params);

      return res.json({
        error: 0,
        message: "User updated successfully.",
      });
    }

    // CREATE USER
    const [emailExists] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (emailExists.length > 0) {
      return res.status(400).json({
        error: 1,
        message: "Email already exists.",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO users
      (username, email, password, role_id, status)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        username,
        email,
        password ? await bcrypt.hash(password, 10) : "",
        role_id,
        status ?? 1,
      ]
    );

    res.json({
      error: 0,
      message: "User created successfully.",
      user_id: result.insertId,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 1,
      message: "Server error.",
    });
  }
}
