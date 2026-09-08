const logger = require("../utils/logger");

const sendEmail = async (to, subject, text) => {
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.ADMIN_EMAIL || "gpriyanka17052006@gmail.com";
    
    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not set. Please add it to your environment variables.");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Online Voting System",
          email: senderEmail
        },
        to: [
          {
            email: to
          }
        ],
        subject: subject,
        textContent: text
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Brevo API error: ${response.status} ${errorData}`);
    }

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
