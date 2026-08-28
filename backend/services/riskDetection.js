const LoginAttempt = require("../models/LoginAttempt");

const calculateRiskScore = async (email, success) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentAttempts = await LoginAttempt.find({
    email,
    timestamp: { $gte: fiveMinutesAgo },
  }).sort({ timestamp: -1 });

  const hourlyAttempts = await LoginAttempt.find({
    email,
    timestamp: { $gte: oneHourAgo },
  }).sort({ timestamp: -1 });

  let score = 0;

  const recentFailures = recentAttempts.filter((a) => !a.success).length;
  const hourlyFailures = hourlyAttempts.filter((a) => !a.success).length;

  if (recentFailures >= 5) {
    score += 40;
  } else if (recentFailures >= 3) {
    score += 25;
  } else if (recentFailures >= 1) {
    score += 10;
  }

  if (hourlyFailures >= 10) {
    score += 30;
  } else if (hourlyFailures >= 5) {
    score += 15;
  }

  const totalRecentAttempts = recentAttempts.length;
  if (totalRecentAttempts >= 8) {
    score += 20;
  } else if (totalRecentAttempts >= 5) {
    score += 10;
  }

  if (!success) {
    score += 5;
  }

  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    score += 10;
  }

  score = Math.min(score, 100);

  let riskLevel = "normal";
  if (score > 60) {
    riskLevel = "suspicious";
  } else if (score > 30) {
    riskLevel = "review";
  }

  return { score, riskLevel };
};

const recordLoginAttempt = async (email, success, ip, userAgent) => {
  const { score, riskLevel } = await calculateRiskScore(email, success);

  const attempt = await LoginAttempt.create({
    email,
    success,
    ip: ip || "unknown",
    userAgent: userAgent || "unknown",
    riskScore: score,
    riskLevel,
    timestamp: new Date(),
  });

  return attempt;
};

const getSuspiciousAlerts = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const alerts = await LoginAttempt.find({
    riskLevel: { $in: ["review", "suspicious"] },
  })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await LoginAttempt.countDocuments({
    riskLevel: { $in: ["review", "suspicious"] },
  });

  return { alerts, total, page, totalPages: Math.ceil(total / limit) };
};

const getSecurityStats = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const totalAttempts = await LoginAttempt.countDocuments();
  const recentAttempts = await LoginAttempt.countDocuments({
    timestamp: { $gte: oneDayAgo },
  });
  const suspiciousCount = await LoginAttempt.countDocuments({
    riskLevel: "suspicious",
  });
  const reviewCount = await LoginAttempt.countDocuments({
    riskLevel: "review",
  });
  const failedAttempts = await LoginAttempt.countDocuments({
    success: false,
    timestamp: { $gte: oneDayAgo },
  });

  return {
    totalAttempts,
    recentAttempts,
    suspiciousCount,
    reviewCount,
    failedAttempts,
  };
};

module.exports = {
  calculateRiskScore,
  recordLoginAttempt,
  getSuspiciousAlerts,
  getSecurityStats,
};
