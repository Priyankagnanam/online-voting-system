const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
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
    if (process.env.OTP_DEV_MODE === "true" && process.env.NODE_ENV !== "production") {
      logger.info("--------------------------------------------------");
      logger.info("DEV FALLBACK - email delivery failed, contents shown below:");
      logger.info(`  To:      ${to}`);
      logger.info(`  Subject: ${subject}`);
      logger.info("  Body:");
      logger.info(text);
      logger.info("--------------------------------------------------");
      return true; // Pretend it succeeded in explicitly configured dev mode
    }
    return false;
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
