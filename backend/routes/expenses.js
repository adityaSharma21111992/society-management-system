import express from "express";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getMonthlyExpense,
} from "../controllers/expensesController.js";
import { verifyToken } from "../controllers/authController.js";

const router = express.Router();

router.get("/", verifyToken, getExpenses);
router.post("/", verifyToken, addExpense);
router.put("/:id", verifyToken, updateExpense);
router.delete("/:id", verifyToken, deleteExpense);
router.get("/monthly/:year/:month", verifyToken, getMonthlyExpense);

export default router;
