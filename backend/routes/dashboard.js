import express from "express";
import { getDashboardSummary, getDashboardAnalytics } from "../controllers/dashboardController.js";

const router = express.Router();

// Returns basic summary: total income, expense, net, list of flats
router.get("/summary", getDashboardSummary);

// Returns analytics reports: monthly, pending flats, yearly summary
router.get("/analytics", getDashboardAnalytics);

export default router;
