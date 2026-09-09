const nodemailer = require("nodemailer");
const dns = require("dns");
const net = require("net");
const logger = require("../utils/logger");

// Prefer IPv4 for outbound SMTP: providers like Render/Vercel often have no IPv6
// route, and smtp.gmail.com resolves to IPv6 first, causing ENETUNREACH.
dns.setDefaultResultOrder("ipv4first");

// nodemailer resolves hostnames itself (A + AAAA) and may pick an unroutable IPv6
// address (or a blackholed A record), so pin to explicit IPv4 addresses and try them all.
const getHostInfo = async () => {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  if (net.isIP(host) !== 0) {
    return { servername: undefined, addresses: [host] };
  }
  try {
    const addresses = await dns.promises.resolve4(host);
    if (addresses && addresses.length > 0) {
      return { servername: host, addresses: [...new Set(addresses)].slice(0, 6) };
    }
  } catch (err) {
    logger.error(`DNS resolve4 failed for ${host}: ${err.message}`);
  }
  return { servername: undefined, addresses: [host] };
};

const getTransporter = (port, secure, hostInfo) => {
  const smtpUser = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || "").trim();
  const smtpPass = (process.env.SMTP_PASSWORD || "").trim();
  return hostInfo.addresses.map((address) => {
    const transportOpts = {
      host: address,
      port,
      secure,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };
    if (hostInfo.servername) {
      transportOpts.servername = hostInfo.servername;
    }
    return nodemailer.createTransport(transportOpts);
  });
};

const sendViaSMTP = async (to, subject, text) => {
  const from = (process.env.SMTP_USER || process.env.ADMIN_EMAIL || "gpriyanka17052006@gmail.com").trim();
  const configuredPort = parseInt((process.env.SMTP_PORT || "465").trim(), 10) || 465;
  const configuredSecure = (process.env.SMTP_SECURE || "true").trim() === "true";

  const ports = [[configuredPort, configuredSecure]];
  if (!(configuredPort === 587 && !configuredSecure)) {
    ports.push([587, false]);
  }

  const hostInfo = await getHostInfo();
  const attempts = [];
  for (const address of hostInfo.addresses) {
    for (const [port, secure] of ports) {
      attempts.push([address, port, secure]);
    }
  }

  let lastErr;
  for (const [address, port, secure] of attempts) {
    const [transporter] = getTransporter(port, secure, { ...hostInfo, addresses: [address] });
    try {
      await transporter.sendMail({ from, to, subject, text });
      return;
    } catch (err) {
      lastErr = err;
      logger.error(`SMTP attempt failed (${address}:${port} secure=${secure}): ${err.message}`);
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
    throw new Error(`Brevo API error: ${response.status} ${response.statusText}`);
  }
};

// Brevo SMTP relay on port 2525 (Render blocks egress on 465/587 but 2525 is open)
const sendViaBrevoSmtp = async (to, subject, text) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) throw new Error("BREVO_API_KEY is not configured");
  const smtpLogin = process.env.BREVO_SMTP_USER || brevoApiKey;
  const senderEmail = process.env.ADMIN_EMAIL || "gpriyanka17052006@gmail.com";
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: smtpLogin,
      pass: brevoApiKey,
    },
  });
  await transporter.sendMail({ from: senderEmail, to, subject, text });
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
  const failures = [];

  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      await sendViaSMTP(to, subject, text);
      logger.info(`Email sent successfully to ${to} via SMTP`);
      return { ok: true, method: "smtp" };
    } catch (error) {
      failures.push(`smtp:${error.message}`);
      logger.error(`SMTP send error: ${error.message}`);
    }
  }

  if (process.env.BREVO_API_KEY) {
    try {
      await sendViaBrevo(to, subject, text);
      logger.info(`Email sent successfully to ${to} via Brevo API`);
      return { ok: true, method: "brevo" };
    } catch (error) {
      failures.push(`brevo-api:${error.message}`);
      logger.error(`Brevo API send error: ${error.message}`);
    }
  }

  if (process.env.BREVO_API_KEY) {
    try {
      await sendViaBrevoSmtp(to, subject, text);
      logger.info(`Email sent successfully to ${to} via Brevo SMTP relay`);
      return { ok: true, method: "brevo-smtp" };
    } catch (error) {
      failures.push(`brevo-smtp:${error.message}`);
      logger.error(`Brevo SMTP relay send error: ${error.message}`);
    }
  }

  logEmailContents(details, text);
  const firstError = failures[0] || "";
  return {
    ok: false,
    method: failures.length ? firstError.split(":")[0] : "unconfigured",
    error: failures.join(" | ") || "No email provider configured",
  };
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