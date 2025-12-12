import db from "../config/db.js";
import { generateInvoicePDF } from "../routes/createInvoicePDF.js";
import path from "path";

/**
 * Get payments (server-side search, filters & pagination)
 * Query params:
 *   search (flat number OR owner name),
 *   month,
 *   year,
 *   page (default 1),
 *   limit (default 10)
 */
export const getPayments = async (req, res) => {
  try {
    const {
      search = "",
      month = "",
      year = "",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageLimit = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * pageLimit;

    const conditions = [];
    const params = [];

    if (search && search.trim() !== "") {
      conditions.push("(f.flat_number LIKE ? OR f.owner_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (month) {
      conditions.push("p.month = ?");
      params.push(month);
    }
    if (year) {
      conditions.push("p.year = ?");
      params.push(year);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total rows
    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM payments p
      LEFT JOIN flats f ON p.flat_id = f.flat_id
      ${whereClause}
      `,
      params
    );

    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / pageLimit);

    // Fetch page rows
    const [rows] = await db.query(
  `
  SELECT
    p.*,
    f.flat_number,
    f.owner_name,
    f.phone_number,
    cu.name AS created_by_name,
    uu.name AS updated_by_name
  FROM payments p
  LEFT JOIN flats f ON p.flat_id = f.flat_id
  LEFT JOIN users cu ON p.created_by = cu.user_id
  LEFT JOIN users uu ON p.updated_by = uu.user_id
  ${whereClause}
  ORDER BY p.payment_date DESC, p.payment_id DESC
  LIMIT ? OFFSET ?
  `,
  [...params, pageLimit, offset]
);


    // ✅ Fix timezone issue: convert payment_date to YYYY-MM-DD
    const normalizedRows = rows.map((r) => ({
      ...r,
      payment_date: r.payment_date
        ? new Date(r.payment_date.getTime() - r.payment_date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10)
        : null,
    }));

    res.json({
      data: normalizedRows,
      pagination: {
        total,
        totalPages,
        currentPage: pageNum,
        limit: pageLimit,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching payments:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Add payment
 */
export const addPayment = async (req, res) => {
  try {
    const { flat_id, amount, mode, month, year, remark, paid_date, user_id } = req.body;

    if (!flat_id || !amount || !month || !year || !paid_date) {
      return res.status(400).json({
        error: "flat_id, amount, month, year, and paid_date are required",
      });
    }

    // ✅ Determine correct numeric creator ID
    // Prefer user from token, then body user_id, then fallback admin
    const userFromToken = req.user?.user_id || req.user?.id;
    let createdBy = null;
    if (userFromToken && !isNaN(userFromToken)) {
      createdBy = parseInt(userFromToken);
    } else if (user_id && !isNaN(user_id)) {
      createdBy = parseInt(user_id);
    } else {
      // Find admin user ID (fallback)
      const [rows] = await db.query("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1");
      if (rows.length) {
        createdBy = rows[0].user_id;
      } else {
        // Create one admin if missing
        const [result] = await db.query(
          `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
          ["System Admin", "admin@society.com", "devpass123", "admin"]
        );
        createdBy = result.insertId;
      }
    }

    // ✅ Insert payment with safe created_by
    const [result] = await db.query(
      `INSERT INTO payments
        (flat_id, amount_paid, payment_mode, payment_date, remarks, month, year, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [flat_id, amount, mode || "Cash", paid_date, remark || "", month, year, createdBy]
    );

    res.status(201).json({ message: "Payment added successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Add payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update payment
 */
export const updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { flat_id, amount, mode, month, year, remark, paid_date, user_id } = req.body;

    if (!paymentId) return res.status(400).json({ error: "paymentId is required" });

    // ✅ Determine correct numeric updater ID
    // Prefer user from token, then body user_id, then admin fallback
    const userFromToken = req.user?.user_id || req.user?.id;
    let updatedBy = null;
    if (userFromToken && !isNaN(userFromToken)) {
      updatedBy = parseInt(userFromToken);
    } else if (user_id && !isNaN(user_id)) {
      updatedBy = parseInt(user_id);
    } else {
      const [rows] = await db.query("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1");
      if (rows.length) updatedBy = rows[0].user_id;
    }

    await db.query(
      `UPDATE payments SET
         flat_id = ?,
         amount_paid = ?,
         payment_mode = ?,
         payment_date = ?,
         remarks = ?,
         month = ?,
         year = ?,
         updated_by = ?,
         updated_at = NOW()
       WHERE payment_id = ?`,
      [flat_id, amount, mode, paid_date, remark, month, year, updatedBy, paymentId]
    );

    res.json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error("❌ Update payment error:", err);
    res.status(500).json({ error: err.message });
  }
};



/**
 * Delete payment
 */
export const deletePayment = async (req, res) => {
  const { paymentId } = req.params;
  if (!paymentId) return res.status(400).json({ error: "paymentId is required" });

  try {
    await db.query("DELETE FROM payments WHERE payment_id = ?", [paymentId]);
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    console.error("❌ Delete payment error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Download invoice (generate PDF and send file)
 * body: { payment_id }
 */
export const sendInvoice = async (req, res) => {
  const { payment_id } = req.body;
  try {
    const [[payment]] = await db.query("SELECT * FROM payments WHERE payment_id = ?", [payment_id]);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const [[flat]] = await db.query("SELECT * FROM flats WHERE flat_id = ?", [payment.flat_id]);
    if (!flat) return res.status(404).json({ error: "Flat not found" });

    const filePath = path.join("invoices", `invoice_${payment.payment_id}.pdf`);
    await generateInvoicePDF(payment, flat, filePath);

    res.download(filePath, `invoice_${payment.payment_id}.pdf`, (err) => {
      if (err) console.error("❌ Download error:", err);
    });
  } catch (err) {
    console.error("❌ Invoice error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
};

/**
 * Get monthly totals (unchanged)
 */
export const getMonthlyPayments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(payment_date, '%Y-%m') AS month, SUM(amount_paid) AS total_amount
       FROM payments
       GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
       ORDER BY month DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Monthly payments error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get payments by flat (unchanged)
 */
export const getPaymentsByFlat = async (req, res) => {
  const { flatId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT * FROM payments WHERE flat_id = ? ORDER BY payment_date DESC`,
      [flatId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Get payments by flat error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get delete config flag
 */
export const getDeleteConfig = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT isDeletePayment FROM config LIMIT 1");
    res.json({ isDeletePayment: rows[0]?.isDeletePayment || 0 });
  } catch (err) {
    console.error("❌ Get delete-config error:", err);
    res.status(500).json({ error: err.message });
  }
};
