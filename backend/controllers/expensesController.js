// controllers/expensesController.js
import db from "../config/db.js";

/**
 * Helper: Normalize expense dates and audit info
 */
const normalizeExpense = (row) => ({
  ...row,
  date: row.date ? new Date(row.date).toISOString().split("T")[0] : null,
  created_at: row.created_at
    ? new Date(row.created_at).toISOString().replace("T", " ").split(".")[0]
    : null,
  updated_at: row.updated_at
    ? new Date(row.updated_at).toISOString().replace("T", " ").split(".")[0]
    : null,
  created_by_name: row.created_by_name || null,
  updated_by_name: row.updated_by_name || null,
});

/**
 * Get all expenses
 */
export const getExpenses = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.*,
             u1.name AS created_by_name,
             u2.name AS updated_by_name
      FROM expenses e
      LEFT JOIN users u1 ON e.created_by = u1.user_id
      LEFT JOIN users u2 ON e.updated_by = u2.user_id
      ORDER BY e.date DESC, e.expense_id DESC
    `);

    res.json(rows.map(normalizeExpense));
  } catch (err) {
    console.error("❌ Error fetching expenses:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
};

/**
 * Add a new expense
 */
export const addExpense = async (req, res) => {
  try {
    const { title, description, amount, date, paid_by } = req.body;
  // Prefer authenticated token user_id, then request body user_id, then fallback to admin user
  const userFromToken = req.user?.user_id || req.user?.id;
  const user_id = userFromToken || req.body?.user_id || 1; // fallback to admin ID 1

    if (!title || !amount || !date) {
      return res.status(400).json({ error: "Title, amount, and date are required" });
    }

    const numericAmount = parseFloat(amount);
    const expenseDate = new Date(date);

    const [result] = await db.query(
      `INSERT INTO expenses 
       (title, description, amount, date, paid_by, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || "", numericAmount, expenseDate, paid_by || "", user_id]
    );

    const [rows] = await db.query(`
      SELECT e.*,
             u1.name AS created_by_name,
             u2.name AS updated_by_name
      FROM expenses e
      LEFT JOIN users u1 ON e.created_by = u1.user_id
      LEFT JOIN users u2 ON e.updated_by = u2.user_id
      WHERE e.expense_id = ?
    `, [result.insertId]);

    res.status(201).json({ message: "Expense added successfully", expense: normalizeExpense(rows[0]) });
  } catch (err) {
    console.error("❌ Add expense error:", err);
    res.status(500).json({ error: "Failed to add expense" });
  }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, date, paid_by } = req.body;
  const userFromToken = req.user?.user_id || req.user?.id;
  const user_id = userFromToken || req.body?.user_id || 1;

    if (!title || !amount || !date) {
      return res.status(400).json({ error: "Title, amount, and date are required" });
    }

    const numericAmount = parseFloat(amount);
    const expenseDate = new Date(date);

    const [result] = await db.query(
      `UPDATE expenses 
       SET title = ?, description = ?, amount = ?, date = ?, paid_by = ?, updated_by = ? 
       WHERE expense_id = ?`,
      [title, description || "", numericAmount, expenseDate, paid_by || "", user_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const [rows] = await db.query(`
      SELECT e.*,
             u1.name AS created_by_name,
             u2.name AS updated_by_name
      FROM expenses e
      LEFT JOIN users u1 ON e.created_by = u1.user_id
      LEFT JOIN users u2 ON e.updated_by = u2.user_id
      WHERE e.expense_id = ?
    `, [id]);

    res.json({ message: "Expense updated successfully", expense: normalizeExpense(rows[0]) });
  } catch (err) {
    console.error("❌ Update expense error:", err);
    res.status(500).json({ error: "Failed to update expense" });
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Expense ID required" });

    const [result] = await db.query("DELETE FROM expenses WHERE expense_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("❌ Delete expense error:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
};

/**
 * Get monthly total expense
 */
export const getMonthlyExpense = async (req, res) => {
  try {
    const { year, month } = req.params;
    const [rows] = await db.query(
      `SELECT SUM(amount) AS total_expense
       FROM expenses
       WHERE YEAR(date) = ? AND MONTH(date) = ?`,
      [Number(year), Number(month)]
    );

    res.json({ total_expense: Number(rows[0]?.total_expense || 0) });
  } catch (err) {
    console.error("❌ Monthly expense error:", err);
    res.status(500).json({ error: "Failed to fetch monthly expense" });
  }
};
