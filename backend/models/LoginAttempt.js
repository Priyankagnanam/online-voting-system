const mongoose = require("mongoose");

const loginAttemptSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  success: {
    type: Boolean,
    required: true,
  },
  ip: {
    type: String,
    default: "unknown",
  },
  userAgent: {
    type: String,
    default: "unknown",
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  riskLevel: {
    type: String,
    enum: ["normal", "review", "suspicious"],
    default: "normal",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

loginAttemptSchema.index({ email: 1, timestamp: -1 });

module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);
