import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || "yoursecretkey"; // unified fallback

/**
 * ✅ Register a new user
 * Only accessible to admin (check handled in routes)
 */
export const registerUser = async (req, res) => {
  const { name, email, phone_number, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone_number || null, hashedPassword, role || "viewer"]
    );

    res.status(201).json({
      message: "User created successfully ✅",
      id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
};

/**
 * ✅ Login user (email, username, or mobile allowed)
 */
export const loginUser = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // ✅ Find user by email, username, or mobile
    const [rows] = await db.query(
      `SELECT user_id, name, email, username, mobile, password, role 
       FROM users 
       WHERE email = ? OR username = ? OR mobile = ? 
       LIMIT 1`,
      [id, id, id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Create JWT safely
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    // ✅ Send minimal safe user info
    return res.status(200).json({
      message: "Login successful ✅",
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ error: "Failed to login. Please try again." });
  }
};


/**
 * ✅ Middleware to verify JWT token
 * Adds decoded user to req.user
 */
export const verifyToken = (req, res, next) => {
  try {
    // ✅ Check all possible header variations
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.headers["x-access-token"];

    console.log("🧩 Incoming Authorization Header:", authHeader);

    if (!authHeader) {
      return res.status(403).json({ message: "No token provided" });
    }

    // ✅ Extract token (handle Bearer prefix)
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    console.log("🔹 Extracted Token:", token);

    if (!token) {
      return res.status(403).json({ message: "Invalid token format" });
    }

    // ✅ Verify token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error("❌ Token verification failed:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // ✅ Normalize decoded payload
      req.user = {
        user_id: decoded.user_id || decoded.id,
        role: decoded.role || "viewer",
      };

      console.log("✅ Verified user payload:", req.user);
      next();
    });
  } catch (error) {
    console.error("❌ verifyToken error:", error);
    return res.status(500).json({ message: "Token verification error" });
  }
};
