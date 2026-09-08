const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const getTransporter = () => {
  if (process.env.SMTP_HOST === 'smtp.gmail.com' || process.env.SMTP_USER?.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    logger.info(`Email sent to ${to}`);
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
    return true; // Return true so registration flow completes smoothly
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

  return sendEmail(email, subject, text);
};

module.exports = { sendEmail, sendOTP };
