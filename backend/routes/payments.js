import express from "express";
import {
  getPayments,
  getPaymentsByFlat,
  getMonthlyPayments,
  addPayment,
  updatePayment,
  deletePayment,
  sendInvoice,
  getDeleteConfig
} from "../controllers/paymentsController.js";

const router = express.Router();

// Payment CRUD
router.get("/", getPayments);
router.get("/flat/:flatId", getPaymentsByFlat);
router.get("/monthly/:year/:month", getMonthlyPayments);

router.post("/", addPayment);
router.put("/:paymentId", updatePayment);    // Update
router.delete("/:paymentId", deletePayment); // Delete

// Single invoice route
router.post("/invoice", sendInvoice);
router.get("/payments", getPayments);
router.post("/payments", addPayment);
router.put("/payments/:paymentId", updatePayment);
router.delete("/payments/:paymentId", deletePayment);
router.post("/payments/invoice", sendInvoice);
router.get("/payments/monthly", getMonthlyPayments);
router.get("/payments/flat/:flatId", getPaymentsByFlat);
router.get("/config/delete-payment", getDeleteConfig);



export default router;
