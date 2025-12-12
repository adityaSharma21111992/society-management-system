import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Temporary in-memory OTP storage (for now)
const otpStore = new Map();

/**
 * ✅ Send OTP to WhatsApp
 */
export const sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone is required" });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999);
  otpStore.set(phone, otp);

  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  const url = process.env.WHATSAPP_API_URL || `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: `Your OTP is: ${otp}. Valid for 5 minutes.` },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`✅ OTP sent to ${phone}: ${otp}`);
    return res.status(200).json({ success: true, message: "OTP sent via WhatsApp" });
  } catch (error) {
    console.error("WhatsApp OTP Error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to send OTP",
      details: error.response?.data || error.message,
    });
  }
};

/**
 * ✅ Verify OTP actual integration with whatsapp
 */
/*
export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  const storedOtp = otpStore.get(phone);

  if (!storedOtp) return res.status(400).json({ error: "No OTP found or expired" });

  if (parseInt(otp) === storedOtp) {
    otpStore.delete(phone);
    return res.status(200).json({ success: true, message: "OTP verified" });
  } else {
    return res.status(400).json({ error: "Invalid OTP" });
  }
};*/

/**
 * ✅ Temporarily bypass OTP verification (for testing)
 */
export const verifyOTP = async (req, res) => {
  if (process.env.REACT_APP_BYPASS_OTP === "true") {
    console.log("⚠️ OTP bypass active — skipping verification.");
    return res.status(200).json({ success: true, message: "OTP bypassed (test mode)" });
  }

  const { phone, otp } = req.body;
  const storedOtp = otpStore.get(phone);

  if (!storedOtp) return res.status(400).json({ error: "No OTP found or expired" });
  if (parseInt(otp) === storedOtp) {
    otpStore.delete(phone);
    return res.status(200).json({ success: true, message: "OTP verified" });
  } else {
    return res.status(400).json({ error: "Invalid OTP" });
  }
};



/**
 * ✅ Send any WhatsApp message (general)
 */
export const sendMessage = async (req, res) => {
  const { phone, message } = req.body;

  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;

  if (!phone || !message) {
    return res.status(400).json({ error: "Phone and message are required" });
  }

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("WhatsApp API Error:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to send WhatsApp message",
      details: error.response?.data || error.message,
    });
  }
};
