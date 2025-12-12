import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import appConfig from "../config/appConfig.js";

/**
 * Generate a professional PDF Invoice for a payment
 * @param {Object} payment - Payment details
 * @param {Object} flat - Flat details
 * @param {string} outputPath - Path to save the PDF
 */
export const generateInvoicePDF = (payment, flat, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filePath = outputPath || path.join("invoices", `invoice_${payment.payment_id}.pdf`);

      // Ensure invoices folder exists
      if (!fs.existsSync("invoices")) fs.mkdirSync("invoices");

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ---------------------- Letterhead ----------------------
      doc
        .fontSize(22)
        .fillColor("#0a3d62")
        .text(appConfig.societyName, { align: "center" })
        .moveDown(0.3);

      doc
        .fontSize(12)
        .fillColor("black")
        .text("Society Maintenance Invoice", { align: "center", underline: true })
        .moveDown(1);

      // ---------------------- Invoice Info ----------------------
      doc
        .fontSize(10)
        .text(`Invoice ID: ${payment.payment_id}`, { continued: true })
        .text(`     Date: ${new Date(payment.payment_date).toLocaleDateString()}`, { align: "right" })
        .moveDown(0.5);

      // ---------------------- Flat & Owner Info ----------------------
      doc
        .fontSize(12)
        .fillColor("#000")
        .text(`Flat Number: ${flat.flat_number}`, { continued: true })
        .text(`     Owner Name: ${flat.owner_name}`, { align: "right" })
        .moveDown(0.2);

      doc
        .fontSize(12)
        .text(`     Phone: ${flat.phone_number || "N/A"}`, { align: "right" })
        .moveDown(1);

      // ---------------------- Payment Table ----------------------
      const startY = doc.y;
      const tableTop = startY;
      const itemIndent = 50;

      doc.fontSize(12).text("Payment Details:", itemIndent, tableTop);

      const details = [
        { label: "Maintenance Month/Year", value: `${payment.month}/${payment.year}` },
        { label: "Payment Mode", value: payment.payment_mode },
        { label: "Amount Paid", value: `Rs. ${Number(payment.amount_paid).toFixed(2)}` },
        { label: "Remarks", value: payment.remarks || "-" },
      ];

      details.forEach((d, i) => {
        const y = tableTop + 20 + i * 20;
        doc.font("Helvetica-Bold").text(`${d.label}:`, itemIndent, y, { continued: true });
        doc.font("Helvetica").text(` ${d.value}`);
      });

      // ---------------------- Footer ----------------------
      doc.moveDown(4);
      doc
        .fontSize(12)
        .fillColor("#0a3d62")
        .text("Thank you for your payment!", { align: "center" })
        .moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor("gray")
        .text(`${appConfig.societyName} - Society Management System`, { align: "center" });

      doc.end();

      writeStream.on("finish", () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
};
