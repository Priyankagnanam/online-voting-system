const User = require("../models/User");
const OTP = require("../models/OTP");
const ApprovedVoter = require("../models/ApprovedVoter");
const generateOTP = require("../utils/generateOTP");
const { sendOTP } = require("../services/email");
const { recordLoginAttempt } = require("../services/riskDetection");
const logger = require("../utils/logger");

const register = async (req, res) => {
  try {
    const { name, email, password, rollNumber } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : "";
    const cleanRoll = rollNumber ? rollNumber.trim().toUpperCase() : "";

    // Check if voter pre-approval is required (if list is not empty)
    const approvedCount = await ApprovedVoter.countDocuments();
    if (approvedCount > 0) {
      const queryConditions = [];
      if (cleanRoll) queryConditions.push({ rollNumber: cleanRoll });
      if (cleanEmail) queryConditions.push({ email: cleanEmail });

      const isApproved = await ApprovedVoter.findOne({
        $or: queryConditions.length > 0 ? queryConditions : [{ email: cleanEmail }],
      });

      if (!isApproved || isApproved.isEligible === false) {
        return res.status(400).json({
          error: "You are not registered as an eligible voter.",
        });
      }
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    if (cleanRoll) {
      const existingRoll = await User.findOne({ rollNumber: cleanRoll });
      if (existingRoll) {
        return res.status(400).json({ error: "This Roll/Register Number is already registered." });
      }
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      rollNumber: cleanRoll || undefined,
      passwordHash: password,
      isVerified: false,
    });

    const otp = generateOTP();
    await OTP.create({
      email: cleanEmail,
      otpHash: otp,
      purpose: "verification",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(cleanEmail, otp, "verification");

    res.status(201).json({
      message:
        "Registration successful. Please verify your email with the OTP sent to your inbox. Your account will be active after admin approval.",
      userId: user._id,
    });
  } catch (error) {
    logger.error("Register error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error during registration" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    const user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.json({
        message: user.role === "admin" ? "Account is already active." : "Email already verified. You can log in now.",
      });
    }

    const otpRecord = await OTP.findOne({
      email,
      purpose: purpose || "verification",
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const isMatch = await otpRecord.compareOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpRecord.used = true;
    await otpRecord.save();

    if (purpose === "verification") {
      await User.findOneAndUpdate({ email }, { isVerified: true });
      return res.json({ message: "Email verified successfully" });
    }

    res.json({ message: "OTP verified. You may now reset your password." });
  } catch (error) {
    logger.error("Verify OTP error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error during OTP verification" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : "";
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    const user = await User.findOne({ email: cleanEmail });
    logger.info("Login attempt details", {
      attemptedEmail: cleanEmail,
      userFound: !!user,
      userRole: user ? user.role : null,
      isVerified: user ? user.isVerified : null,
    });

    if (!user) {
      await recordLoginAttempt(cleanEmail, false, ip, userAgent);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      await recordLoginAttempt(cleanEmail, false, ip, userAgent);
      return res.status(403).json({ error: "Please verify your email first." });
    }

    if (user.approvalStatus !== "APPROVED") {
      await recordLoginAttempt(cleanEmail, false, ip, userAgent);
      const error =
        user.approvalStatus === "REJECTED"
          ? "Your registration has not been approved."
          : "Your registration is awaiting admin approval.";
      return res.status(403).json({ error, approvalStatus: user.approvalStatus });
    }

    const isMatch = await user.comparePassword(password);
    logger.info("Password check", { attemptedEmail: cleanEmail, isMatch });
    if (!isMatch) {
      await recordLoginAttempt(cleanEmail, false, ip, userAgent);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const loginRecord = await recordLoginAttempt(email, true, ip, userAgent);

    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    logger.error("Login error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error during login" });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : "";

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    if (user.isVerified) {
      return res.json({ message: "Email is already verified. You can log in now." });
    }

    const otp = generateOTP();
    await OTP.create({
      email: cleanEmail,
      otpHash: otp,
      purpose: "verification",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(cleanEmail, otp, "verification");

    res.json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    logger.error("Resend OTP error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const otp = generateOTP();
    await OTP.create({
      email,
      otpHash: otp,
      purpose: "password-reset",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(email, otp, "password-reset");

    res.json({ message: "OTP sent to your email for password reset" });
  } catch (error) {
    logger.error("Forgot password error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({
      email,
      purpose: "password-reset",
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const isMatch = await otpRecord.compareOTP(otp);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpRecord.used = true;
    await otpRecord.save();

    const user = await User.findOne({ email });
    user.passwordHash = newPassword;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    logger.error("Reset password error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error during password reset" });
  }
};

const getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { register, verifyOTP, login, resendOTP, forgotPassword, resetPassword, getMe };
