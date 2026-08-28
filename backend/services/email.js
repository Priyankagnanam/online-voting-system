const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Email send error: ${error.message}`);
    if (process.env.NODE_ENV !== "production") {
      console.log("--------------------------------------------------");
      console.log("DEV FALLBACK - email delivery failed, contents shown below:");
      console.log(`  To:      ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log("  Body:");
      console.log(text);
      console.log("--------------------------------------------------");
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
