const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const getTransporter = () => {
  const smtpUser = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || "").trim();
  const smtpPass = (process.env.SMTP_PASSWORD || "").trim();
  return nodemailer.createTransport({
    host: (process.env.SMTP_HOST || "smtp.gmail.com").trim(),
    port: parseInt((process.env.SMTP_PORT || "465").trim(), 10),
    secure: (process.env.SMTP_SECURE || "true").trim() === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const sendViaSMTP = async (to, subject, text) => {
  const transporter = getTransporter();
  const from = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || "gpriyanka17052006@gmail.com").trim();
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
};

const sendViaBrevo = async (to, subject, text) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) throw new Error("BREVO_API_KEY is not configured");
  const senderEmail = process.env.ADMIN_EMAIL || "gpriyanka17052006@gmail.com";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": brevoApiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Online Voting System", email: senderEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Brevo API error: ${response.status}`);
  }
};

const sendEmail = async (to, subject, text) => {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      await sendViaSMTP(to, subject, text);
      logger.info(`Email sent successfully to ${to} via SMTP`);
      return true;
    }
    await sendViaBrevo(to, subject, text);
    logger.info(`Email sent successfully to ${to} via Brevo`);
    return true;
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    logger.info("--------------------------------------------------");
    logger.info("EMAIL FALLBACK - Delivery failed or pending, contents:");
    logger.info(`  To:      ${to}`);
    logger.info(`  Subject: ${subject}`);
    logger.info("  Body:");
    logger.info(text);
    logger.info("--------------------------------------------------");
    return true;
  }
};

const sendOTP = async (email, otp, purpose) => {
  const subject =
    purpose === "verification"
      ? "Verify Your Email - Online Voting System"
      : "Reset Password - Online Voting System";

  const text =
    purpose === "verification"
      ? `Your verification OTP is: ${otp}\n\nThis OTP expires in 10 minutes.\nDo not share this code with anyone.`
      : `Your password reset OTP is: ${otp}\n\nThis OTP expires in 10 minutes.\nDo not share this code with anyone.`;

  if ((process.env.OTP_DEV_MODE || "").toLowerCase() === "true") {
    logger.info(`[DEV] OTP for ${email} (${purpose}): ${otp}`);
  }

  return sendEmail(email, subject, text);
};

module.exports = { sendEmail, sendOTP };