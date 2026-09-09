const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const getTransporter = (port, secure) => {
  const smtpUser = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || "").trim();
  const smtpPass = (process.env.SMTP_PASSWORD || "").trim();
  return nodemailer.createTransport({
    host: (process.env.SMTP_HOST || "smtp.gmail.com").trim(),
    port,
    secure,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

const sendViaSMTP = async (to, subject, text) => {
  const from = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || "gpriyanka17052006@gmail.com").trim();
  const configuredPort = parseInt((process.env.SMTP_PORT || "465").trim(), 10) || 465;
  const configuredSecure = (process.env.SMTP_SECURE || "true").trim() === "true";

  const attempts = [[configuredPort, configuredSecure]];
  if (!(configuredPort === 587 && !configuredSecure)) {
    attempts.push([587, false]);
  }

  let lastErr;
  for (const [port, secure] of attempts) {
    try {
      const transporter = getTransporter(port, secure);
      await transporter.sendMail({ from, to, subject, text });
      return;
    } catch (err) {
      lastErr = err;
      logger.error(`SMTP attempt failed (port ${port}, secure ${secure}): ${err.message}`);
    }
  }
  throw lastErr;
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

const logEmailContents = (details, text) => {
  logger.info("--------------------------------------------------");
  logger.info("EMAIL DELIVERY FAILED - contents:");
  logger.info(`  To:      ${details.to}`);
  logger.info(`  Subject: ${details.subject}`);
  logger.info("  Body:");
  logger.info(text);
  logger.info("--------------------------------------------------");
};

const sendEmail = async (to, subject, text) => {
  const details = { to, subject };

  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      await sendViaSMTP(to, subject, text);
      logger.info(`Email sent successfully to ${to} via SMTP`);
      return { ok: true, method: "smtp" };
    } catch (error) {
      logger.error(`Email send error: ${error.message}`);
      if (process.env.BREVO_API_KEY) {
        try {
          await sendViaBrevo(to, subject, text);
          logger.info(`Email sent successfully to ${to} via Brevo (SMTP failed)`);
          return { ok: true, method: "brevo", fallback: "smtp" };
        } catch (brevoErr) {
          logger.error(`Brevo fallback failed: ${brevoErr.message}`);
        }
      }
      logEmailContents(details, text);
      return { ok: false, method: "smtp", error: error.message };
    }
  }

  try {
    await sendViaBrevo(to, subject, text);
    logger.info(`Email sent successfully to ${to} via Brevo`);
    return { ok: true, method: "brevo" };
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    logEmailContents(details, text);
    return { ok: false, method: "brevo", error: error.message };
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