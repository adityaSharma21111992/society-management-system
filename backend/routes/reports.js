// backend/routes/reports.js
import express from 'express';
import { getSummary, downloadMonthlyReport, downloadYearlyReport, flatReport, expensesReport, userReport } from '../controllers/reportsController.js';

const router = express.Router();

// Summary for charts
router.get('/summary/:year/:month', getSummary);

// PDF downloads
router.get('/monthly', downloadMonthlyReport);
router.get('/yearly', downloadYearlyReport);
router.get("/flats",  flatReport);
router.get("/expenses", expensesReport);
router.get("/users", userReport);


export default router;
