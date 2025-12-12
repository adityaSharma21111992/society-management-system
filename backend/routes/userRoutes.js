import express from "express";
import {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  changePassword,
} from "../controllers/userController.js";
import {
  verifyToken,
  loginUser,
  registerUser,
} from "../controllers/authController.js";

const router = express.Router();

/**
 * ✅ Middleware: Allow only admin users
 */
const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

/**
 * ✅ Auth routes (public)
 * Note: /api/users/login → loginUser
 *       /api/users/register → registerUser
 */
router.post("/login", loginUser);
router.post("/register", registerUser);

/**
 * ✅ User management (admin-only routes)
 */
router.get("/", verifyToken, isAdmin, getAllUsers);
router.post("/", verifyToken, isAdmin, addUser);
router.put("/:id", verifyToken, isAdmin, updateUser);
router.delete("/:id", verifyToken, isAdmin, deleteUser);

/**
 * ✅ Password change route (for any authenticated user)
 */
router.post("/change-password", changePassword);

export default router;