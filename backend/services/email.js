const nodemailer = require("nodemailer");
const dns = require("dns");

// Prefer IPv4 for outbound SMTP: providers like Render/Vercel often have no
// IPv6 route, which causes ENETUNREACH on hosts that resolve to IPv6 first.
dns.setDefaultResultOrder("ipv4first");

// Transport is strictly configured from environment variables:
//   SMTP_HOST       e.g. smtp-relay.brevo.com
//   SMTP_PORT       e.g. 587
//   SMTP_SECURE     'true'/'false' (must be 'false' for port 587)
//   SMTP_USER       Brevo SMTP login
//   SMTP_PASSWORD   Brevo SMTP key
const getTransporter = () => {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT);
  const secure = process.env.SMTP_SECURE === "true";
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASSWORD || "").trim();

  if (!host || !Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP configuration missing: SMTP_HOST and SMTP_PORT are required");
  }
  if (!user || !pass) {
    throw new Error("SMTP authentication missing: SMTP_USER and SMTP_PASSWORD are required");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
};

const sendEmail = async (to, subject, text) => {
  const from = (process.env.SMTP_FROM || "").trim();
  if (!from) throw new Error("SMTP_FROM is not configured");
  if (!to) throw new Error("Recipient email is missing");

  const transporter = getTransporter();
  await transporter.sendMail({ from, to, subject, text });
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
    console.log(`[DEV] OTP for ${email} (${purpose}): ${otp}`);
  }

  console.log(`[OTP] Attempting to send email to ${email}`);
  try {
    await sendEmail(email, subject, text);
    console.log("[OTP] Email sent successfully");
    return { ok: true, method: "smtp" };
  } catch (err) {
    console.error(`[OTP] Email sending failed: ${err.message}`);
    throw err;
  }
};

module.exports = { sendEmail, sendOTP };