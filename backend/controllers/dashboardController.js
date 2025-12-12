import db from "../config/db.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    // ✅ Monthly income
    const [incomeRows] = await db.query(
      "SELECT SUM(amount_paid) AS total_income FROM payments WHERE YEAR(payment_date)=? AND MONTH(payment_date)=?",
      [year, month]
    );

    // ✅ Monthly expenses
    const [expenseRows] = await db.query(
      "SELECT SUM(amount) AS total_expense FROM expenses WHERE YEAR(date)=? AND MONTH(date)=?",
      [year, month]
    );

    // Flats list
    const [flats] = await db.query("SELECT * FROM flats");

    const summary = {
      total_income: incomeRows[0].total_income || 0,
      total_expense: expenseRows[0].total_expense || 0,
      net: (incomeRows[0].total_income || 0) - (expenseRows[0].total_expense || 0),
    };

    res.json({ summary, flats });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getDashboardAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();

    // ---------------- Monthly Report (safe: aggregate first, then join) ----------------
    const [monthly] = await db.query(`
      SELECT
        m.month_number,
        MONTHNAME(STR_TO_DATE(m.month_number, '%m')) AS month_name,
        IFNULL(p.total_income, 0) AS total_income,
        IFNULL(e.monthly_expense, 0) AS total_expense,
        (IFNULL(p.total_income, 0) - IFNULL(e.monthly_expense, 0)) AS net
      FROM (
        SELECT 1 AS month_number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
        SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
        SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
        SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
      ) m
      LEFT JOIN (
        SELECT MONTH(payment_date) AS month_number, SUM(amount_paid) AS total_income
        FROM payments
        WHERE YEAR(payment_date) = ?
        GROUP BY MONTH(payment_date)
      ) p ON m.month_number = p.month_number
      LEFT JOIN (
        SELECT MONTH(date) AS month_number, SUM(amount) AS monthly_expense
        FROM expenses
        WHERE YEAR(date) = ?
        GROUP BY MONTH(date)
      ) e ON m.month_number = e.month_number
      ORDER BY m.month_number;
    `, [year, year]);

    // ---------------- Pending Flats (Last 3 Months) - use payments.month & payments.year ----------------
    const pendingFlatsByMonth = {};
    for (let i = 0; i < 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthNum = d.getMonth() + 1;
      const monthYear = d.getFullYear();
      const key = `${monthYear}-${String(monthNum).padStart(2, '0')}`;

      // Use the month/year columns from payments table to determine payments for that billing month
      const [flats] = await db.query(`
        SELECT
          f.flat_id,
          f.flat_number,
          f.owner_name,
          f.maintenance_amount - IFNULL(SUM(p.amount_paid), 0) AS pending_amount
        FROM flats f
        LEFT JOIN payments p
          ON f.flat_id = p.flat_id
          AND p.month = ? AND p.year = ?
        GROUP BY f.flat_id
        HAVING pending_amount > 0
        ORDER BY f.flat_number;
      `, [monthNum, monthYear]);

      pendingFlatsByMonth[key] = flats;
    }

    // ---------------- Yearly Summary ----------------
    const [yearly] = await db.query(`
      SELECT 
        IFNULL(SUM(p.amount_paid), 0) AS total_income,
        IFNULL((SELECT SUM(amount) FROM expenses WHERE YEAR(date) = ?), 0) AS total_expense,
        IFNULL(SUM(p.amount_paid), 0) - IFNULL((SELECT SUM(amount) FROM expenses WHERE YEAR(date) = ?), 0) AS net
      FROM payments p
      WHERE YEAR(p.payment_date) = ?;
    `, [year, year, year]);

    // ---------------- Send Response ----------------
    res.json({
      monthly,
      pendingFlatsByMonth,
      yearly: yearly[0] || { total_income: 0, total_expense: 0, net: 0 }
    });

  } catch (err) {
    console.error("Dashboard analytics error:", err);
    res.status(500).json({ error: 'Database error' });
  }
};

