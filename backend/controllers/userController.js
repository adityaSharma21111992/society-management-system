import db from "../config/db.js";
import bcrypt from "bcryptjs";

// ✅ Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, name, email, role, status, created_at, updated_at FROM users ORDER BY user_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add new user (Admin only)
export const addUser = async (req, res) => {
  const { name, username, mobile, email, password, role } = req.body;
  if (!name || !email || !username || !mobile || !password)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (name, username, mobile, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, username, mobile, email, hashed, role || "viewer"]
    );
    res.status(201).json({ message: "User created successfully ✅" });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update user (role or status)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, username, mobile, email, role, status } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE users SET name=?, username=?, mobile=?, email=?, role=?, status=? WHERE user_id=?`,
      [name, username, mobile, email, role, status, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully ✅" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM users WHERE user_id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted ✅" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/users/change-password
 * Body: { user_id, old_password, new_password }
 */

// ✅ Safely change user password
export const changePassword = async (req, res) => {
  const { user_id, old_password, new_password } = req.body;

  if (!user_id || !old_password || !new_password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [rows] = await db.query("SELECT password FROM users WHERE user_id = ?", [user_id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Old password is incorrect" });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, user_id]);

    res.json({ message: "Password updated successfully ✅" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};

