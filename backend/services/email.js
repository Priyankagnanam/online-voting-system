const sendEmail = async (to, subject, htmlContent) => {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SMTP_PASSWORD || "").trim();
  if (!apiKey) {
    throw new Error("Brevo API key is not configured (BREVO_API_KEY or SMTP_PASSWORD)");
  }
  const senderEmail = (process.env.SMTP_FROM || "").trim();
  if (!senderEmail) {
    throw new Error("SMTP_FROM is not configured");
  }
  if (!to) {
    throw new Error("Recipient email is missing");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "VoteSecure", email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API error ${response.status} ${response.statusText}: ${body}`);
  }
};

const sendOTP = async (email, otp, purpose) => {
  const isVerification = purpose === "verification";
  const subject = isVerification ? "Your Verification OTP" : "Your Password Reset OTP";
  const htmlContent = `<p>Your OTP is: <strong>${otp}</strong></p>`;

  if ((process.env.OTP_DEV_MODE || "").toLowerCase() === "true") {
    console.log(`[DEV] OTP for ${email} (${purpose}): ${otp}`);
  }

  console.log(`[OTP] Attempting to send email to ${email}`);
  try {
    await sendEmail(email, subject, htmlContent);
    console.log("[OTP] Email sent successfully");
    return { ok: true, method: "brevo-api" };
  } catch (err) {
    console.error(`[OTP] Email sending failed: ${err.message}`);
    throw err;
  }
};

module.exports = { sendEmail, sendOTP };