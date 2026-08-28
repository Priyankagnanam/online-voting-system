const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");
const {
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/verify-otp",
  otpLimiter,
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  validate,
  verifyOTP
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.post(
  "/forgot-password",
  otpLimiter,
  [body("email").isEmail().withMessage("Please enter a valid email")],
  validate,
  forgotPassword
);

router.post(
  "/reset-password",
  otpLimiter,
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  resetPassword
);

router.get("/me", auth, getMe);

module.exports = router;
