// controllers/adminController.js
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'yoursecretkey';
const ADMIN_PASS = process.env.ADMIN_PASS || 'devpass123';

export const adminLogin = async (req, res) => {
  const { id, password } = req.body; // id is just an identifier user typed
  if (!id || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    // Find an existing admin user in DB
    const [rows] = await db.query("SELECT user_id, name, email FROM users WHERE role = 'admin' LIMIT 1");

    let adminUser;
    if (rows.length) {
      adminUser = rows[0];
    } else {
      // Create a system admin user (only if none exists)
      const hashed = await bcrypt.hash(ADMIN_PASS, 10);
      const [r] = await db.query(
        `INSERT INTO users (name, email, password, role, status, created_at, updated_at)
         VALUES (?, ?, ?, 'admin', 'active', NOW(), NOW())`,
        ['System Admin', 'admin@society.com', hashed]
      );
      adminUser = { user_id: r.insertId, name: 'System Admin', email: 'admin@society.com' };
    }

    // Create JWT with numeric user_id and role
    const token = jwt.sign({ user_id: adminUser.user_id, role: 'admin' }, SECRET_KEY, { expiresIn: '8h' });

    return res.json({
      success: true,
      token,
      role: 'admin',
      user: adminUser,
      message: 'Admin login successful ✅',
    });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
