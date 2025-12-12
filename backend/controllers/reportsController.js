// backend/controllers/reportsController.js
import PDFDocument from "pdfkit";
import moment from "moment";
import db from "../config/db.js";
import appConfig from "../config/appConfig.js";

// Summary data for charts
export const getSummary = async (req, res) => {
  try {
    const { year, month } = req.params;

    const [incomeRows] = await db.query(
      "SELECT SUM(amount_paid) AS total_income FROM payments WHERE YEAR(payment_date)=? AND MONTH(payment_date)=?",
      [year, month]
    );

    const [expenseRows] = await db.query(
      "SELECT SUM(amount) AS total_expense FROM expenses WHERE YEAR(date)=? AND MONTH(date)=?",
      [year, month]
    );

    res.json({
      total_income: incomeRows[0].total_income || 0,
      total_expense: expenseRows[0].total_expense || 0,
      net: (incomeRows[0].total_income || 0) - (expenseRows[0].total_expense || 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};

// Helper function to draw a table
const drawTable = (doc, y, columns, data, columnWidths, rowHeight = 20) => {
  doc.fontSize(10);
  let startY = y;

  // Header
  columns.forEach((col, i) => {
    doc.rect(50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, columnWidths[i], rowHeight).fillAndStroke("#0a84ff", "#000");
    doc.fillColor("#fff").text(col, 55 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), startY + 5, { width: columnWidths[i] - 10, align: "center" });
  });

  startY += rowHeight;

  // Rows
  data.forEach(row => {
    columns.forEach((col, i) => {
      doc.rect(50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, columnWidths[i], rowHeight).stroke();
      doc.fillColor("#000").text(row[col] !== undefined ? row[col] : "", 55 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), startY + 5, { width: columnWidths[i] - 10, align: "center" });
    });
    startY += rowHeight;
  });

  return startY;
};

// ---------------- Monthly Report ----------------
export const downloadMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: "Month and year are required" });

    // Payments for the month (join flats to get flat_number and owner_name)
    const [payments] = await db.query(
      `SELECT p.payment_date, f.flat_number, f.owner_name, p.amount_paid, p.remarks AS description
       FROM payments p
       LEFT JOIN flats f ON p.flat_id = f.flat_id
       WHERE YEAR(p.payment_date)=? AND MONTH(p.payment_date)=?`,
      [year, month]
    );

    // Expenses for the month
    const [expenses] = await db.query(
      `SELECT date, title AS category, amount, description 
       FROM expenses 
       WHERE YEAR(date)=? AND MONTH(date)=?`,
      [year, month]
    );

    const totalIncome = payments.reduce((acc, p) => acc + Number(p.amount_paid), 0);
    const totalExpense = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const net = totalIncome - totalExpense;

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Disposition", `attachment; filename=Monthly_Report_${month}_${year}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

  // Header
  doc.fontSize(22).fillColor("#0a84ff").text(appConfig.societyName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor("#000").text(`Monthly Report - ${moment(`${year}-${month}-01`).format("MMMM YYYY")}`, { align: "center" });
    doc.moveDown();

    // Summary
    doc.fillColor("#0a84ff").fontSize(12).text(`Total Income: Rs. ${totalIncome}`);
    doc.fillColor("#ff3b30").text(`Total Expense: Rs. ${totalExpense}`);
    doc.fillColor("#34c759").text(`Net Balance: Rs. ${net}`);
    doc.moveDown(1);

    // Payments Table
    if (payments.length > 0) {
      doc.fillColor("#000").fontSize(14).text("Payments", { underline: true });
      const columns = ["payment_date", "flat_number", "owner_name", "amount_paid", "description"];
      const data = payments.map(p => ({
        payment_date: moment(p.payment_date).format("DD-MM-YYYY"),
        flat_number: p.flat_number,
        owner_name: p.owner_name,
        amount_paid: `Rs. ${p.amount_paid}`,
        description: p.description || "-"
      }));
      drawTable(doc, doc.y, columns, data, [80, 80, 150, 80, 150]);
      doc.moveDown(1);
    }

    // Expenses Table
    if (expenses.length > 0) {
      doc.fillColor("#000").fontSize(14).text("Expenses", { underline: true });
      const columns = ["date", "category", "amount", "description"];
      const data = expenses.map(e => ({
        date: moment(e.date).format("DD-MM-YYYY"),
        category: e.category,
        amount: `Rs. ${e.amount}`,
        description: e.description || "-"
      }));
      drawTable(doc, doc.y, columns, data, [80, 150, 80, 200]);
      doc.moveDown(1);
    }

    // Footer
    doc.fontSize(10).fillColor("#888").text(`Report generated on: ${moment().format("DD MMM YYYY, HH:mm")}`, { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate monthly report" });
  }
};

// ---------------- Yearly Report ----------------
export const downloadYearlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: "Year is required" });

    // Payments for the year (join flats)
    const [payments] = await db.query(
      `SELECT p.payment_date, f.flat_number, f.owner_name, p.amount_paid, p.remarks AS description
       FROM payments p
       LEFT JOIN flats f ON p.flat_id = f.flat_id
       WHERE YEAR(p.payment_date)=?`,
      [year]
    );

    // Expenses for the year
    const [expenses] = await db.query(
      `SELECT date, title AS category, amount, description 
       FROM expenses 
       WHERE YEAR(date)=?`,
      [year]
    );

    const totalIncome = payments.reduce((acc, p) => acc + Number(p.amount_paid), 0);
    const totalExpense = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const net = totalIncome - totalExpense;

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Disposition", `attachment; filename=Yearly_Report_${year}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

  // Header
  doc.fontSize(22).fillColor("#0a84ff").text(appConfig.societyName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor("#000").text(`Yearly Report - ${year}`, { align: "center" });
    doc.moveDown();

    // Summary
    doc.fillColor("#0a84ff").fontSize(12).text(`Total Income: Rs. ${totalIncome}`);
    doc.fillColor("#ff3b30").text(`Total Expense: Rs. ${totalExpense}`);
    doc.fillColor("#34c759").text(`Net Balance: Rs. ${net}`);
    doc.moveDown(1);

    // Payments Table
    if (payments.length > 0) {
      doc.fillColor("#000").fontSize(14).text("Payments", { underline: true });
      const columns = ["payment_date", "flat_number", "owner_name", "amount_paid", "description"];
      const data = payments.map(p => ({
        payment_date: moment(p.payment_date).format("DD-MM-YYYY"),
        flat_number: p.flat_number,
        owner_name: p.owner_name,
        amount_paid: `Rs. ${p.amount_paid}`,
        description: p.description || "-"
      }));
      drawTable(doc, doc.y, columns, data, [80, 80, 150, 80, 150]);
      doc.moveDown(1);
    }

    // Expenses Table
    if (expenses.length > 0) {
      doc.fillColor("#000").fontSize(14).text("Expenses", { underline: true });
      const columns = ["date", "category", "amount", "description"];
      const data = expenses.map(e => ({
        date: moment(e.date).format("DD-MM-YYYY"),
        category: e.category,
        amount: `Rs. ${e.amount}`,
        description: e.description || "-"
      }));
      drawTable(doc, doc.y, columns, data, [80, 150, 80, 200]);
      doc.moveDown(1);
    }

    // Footer
    doc.fontSize(10).fillColor("#888").text(`Report generated on: ${moment().format("DD MMM YYYY, HH:mm")}`, { align: "center" });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate yearly report" });
  }
};


// 1. Flat summary report
export const flatReport = async (req, res) => {
  try {
    // Total flats by ownership type
    const [ownership] = await db.query(`
      SELECT ownership_type, COUNT(*) as count 
      FROM flats 
      GROUP BY ownership_type
    `);

    // Flats paying proper maintenance
    const [paymentStatus] = await db.query(`
      SELECT 
        SUM(CASE WHEN f.maintenance_amount <= IFNULL(p.amount_paid,0) THEN 1 ELSE 0 END) as paid_properly,
        COUNT(f.flat_id) as total_flats
      FROM flats f
      LEFT JOIN (
        SELECT flat_id, SUM(amount_paid) as amount_paid
        FROM payments 
        WHERE year = YEAR(CURDATE()) AND month = MONTH(CURDATE())
        GROUP BY flat_id
      ) p ON f.flat_id = p.flat_id
    `);

    res.json({
      ownership,
      paid_properly: paymentStatus[0].paid_properly,
      total_flats: paymentStatus[0].total_flats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch flat report" });
  }
};

// 2. Expenses trend report
export const expensesReport = async (req, res) => {
  try {
    const [expenses] = await db.query(`
      SELECT 
        DATE_FORMAT(date,'%Y-%m') as month, 
        SUM(amount) as total_amount, 
        title
      FROM expenses
      GROUP BY month, title
      ORDER BY month ASC
    `);
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch expenses report" });
  }
};

// 3. User activity report
/*export const userReport = async (req, res) => {
  try {
    const { user_id, month, year } = req.query;

    // ---- SET YOUR SYSTEM ADMIN USER ID HERE ----
    const SYSTEM_ADMIN_ID = 1;
    // -------------------------------------------

    // Filters for users table
    const userFilter = user_id ? `WHERE u.user_id = ?` : "";

    const expenseWhereParts = [];
    const expenseParams = [];

    // Month/year filters apply only for NON-ADMIN users
    if (month) {
      expenseWhereParts.push(`(MONTH(e.date) = ? OR e.created_by = ${SYSTEM_ADMIN_ID})`);
      expenseParams.push(month);
    }
    if (year) {
      expenseWhereParts.push(`(YEAR(e.date) = ? OR e.created_by = ${SYSTEM_ADMIN_ID})`);
      expenseParams.push(year);
    }

    const expenseWhere = expenseWhereParts.length
      ? `WHERE ${expenseWhereParts.join(" AND ")}`
      : "";

    const mainParams = [];
    if (user_id) mainParams.push(user_id);

    // ---- Subquery: Payments ----
    const paymentsSub = `
      SELECT created_by AS user_id, IFNULL(SUM(amount_paid), 0) AS total_payments
      FROM payments
      GROUP BY created_by
    `;

    // ---- Subquery: Expenses with admin override ----
    const expensesSub = `
      SELECT
        e.created_by AS user_id,
        IFNULL(SUM(e.amount),0) AS total_expenses,
        GROUP_CONCAT(DISTINCT CONCAT('Created by: ', uc.name) SEPARATOR ', ') AS expenses_created_by,
        GROUP_CONCAT(DISTINCT CONCAT('Updated by: ', uu.name) SEPARATOR ', ') AS expenses_updated_by
      FROM expenses e
      LEFT JOIN users uc ON e.created_by = uc.user_id
      LEFT JOIN users uu ON e.updated_by = uu.user_id
      ${expenseWhere}
      GROUP BY e.created_by
    `;

    // ---- Main query ----
    const sql = `
      SELECT
        u.user_id,
        u.name,
        COALESCE(p.total_payments, 0) AS total_payments,
        COALESCE(e.total_expenses, 0) AS total_expenses,
        e.expenses_created_by,
        e.expenses_updated_by
      FROM users u
      LEFT JOIN (${paymentsSub}) p ON u.user_id = p.user_id
      LEFT JOIN (${expensesSub}) e ON u.user_id = e.user_id
      ${userFilter}
      ORDER BY u.name
    `;

    const allParams = [...expenseParams, ...mainParams];
    const [rows] = await db.query(sql, allParams);

    res.json(rows);
  } catch (err) {
    console.error("User report error:", err);
    res.status(500).json({ error: "Failed to fetch user report" });
  }
};*/

//new user avitiy report
// controllers/reportController.js  (or wherever userReport lives)
export const userReport = async (req, res) => {
  try {
    const { user_id, month, year } = req.query;

    // ---------- user filter (applies to final query) ----------
    const userFilter = user_id ? `WHERE u.user_id = ?` : "";

    // ---------- payments filter (Option A: filter by payments.month & payments.year columns) ----------
    let paymentsFilter = "";
    const paymentsParams = [];
    if (month && year) {
      paymentsFilter = `WHERE p.month = ? AND p.year = ?`;
      // push in the same order as placeholders
      paymentsParams.push(month, year);
    }

    // ---------- expenses filter (expenses table has `date` column) ----------
    let expensesFilter = "";
    const expensesParams = [];
    if (month && year) {
      // filter expenses by YEAR(date) and MONTH(date)
      expensesFilter = `WHERE YEAR(e.date) = ? AND MONTH(e.date) = ?`;
      // For expenses subquery we push year then month because placeholders are YEAR(...)=? AND MONTH(...)=?
      expensesParams.push(year, month);
    }

    // ---------- PAYMENTS SUBQUERY ----------
    const paymentsSub = `
      SELECT
        p.created_by AS user_id,
        IFNULL(SUM(p.amount_paid), 0) AS total_payments
      FROM payments p
      ${paymentsFilter}
      GROUP BY p.created_by
    `;

    // ---------- EXPENSES SUBQUERY ----------
    const expensesSub = `
      SELECT
        e.created_by AS user_id,
        IFNULL(SUM(e.amount), 0) AS total_expenses,
        GROUP_CONCAT(DISTINCT uc.name SEPARATOR ', ') AS expenses_created_by,
        GROUP_CONCAT(DISTINCT uu.name SEPARATOR ', ') AS expenses_updated_by
      FROM expenses e
      LEFT JOIN users uc ON e.created_by = uc.user_id
      LEFT JOIN users uu ON e.updated_by = uu.user_id
      ${expensesFilter}
      GROUP BY e.created_by
    `;

    // ---------- MAIN QUERY ----------
    const sql = `
      SELECT
        u.user_id,
        u.name,
        COALESCE(p.total_payments, 0) AS total_payments,
        COALESCE(e.total_expenses, 0) AS total_expenses,
        e.expenses_created_by,
        e.expenses_updated_by
      FROM users u
      LEFT JOIN (${paymentsSub}) p ON u.user_id = p.user_id
      LEFT JOIN (${expensesSub}) e ON u.user_id = e.user_id
      ${userFilter}
      ORDER BY u.name
    `;

    // Important: parameter order must match the order of ? in SQL.
    // paymentsSub placeholders appear before expensesSub placeholders, and userFilter is at the end.
    const finalParams = [...paymentsParams, ...expensesParams, ...(user_id ? [user_id] : [])];

    const [rows] = await db.query(sql, finalParams);

    // If you want totals aggregated across returned rows, you may append them here, but frontend computes totals locally.
    return res.json(rows);
  } catch (err) {
    console.error("User report error:", err);
    return res.status(500).json({ error: "Failed to fetch user report" });
  }
};










