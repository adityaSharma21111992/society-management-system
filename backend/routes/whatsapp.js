import express from "express";
import { sendOTP, verifyOTP /*,sendMessage*/ } from "../controllers/whatsappController.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
//router.post("/send", sendMessage);

export default router;