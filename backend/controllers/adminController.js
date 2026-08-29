const User = require("../models/User");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const { getSuspiciousAlerts, getSecurityStats } = require("../services/riskDetection");
const logger = require('../utils/logger');

const getDashboardStats = async (req, res) => {
  try {
    const totalVoters = await User.countDocuments({ role: "voter" });
    const totalElections = await Election.countDocuments();
    const totalCandidates = await Candidate.countDocuments();
    const totalVotes = await Vote.countDocuments();
    const activeElections = await Election.countDocuments({ status: "active" });
    const security = await getSecurityStats();

    res.json({
      totalVoters,
      totalElections,
      totalCandidates,
      totalVotes,
      activeElections,
      security,
    });
  } catch (error) {
    logger.error("Get admin stats error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("Get users error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const toggleUserVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({
      message: `User ${user.isVerified ? "verified" : "unverified"}`,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error("Toggle verification error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ error: "Cannot delete admin users" });
    }

    await Vote.deleteMany({ voterId: user._id });
    await user.deleteOne();

    logger.info("User deleted", { userId: user._id, requestId: req.id });
    res.json({ message: "User deleted" });
  } catch (error) {
    logger.error("Delete user error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getSecurityAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const data = await getSuspiciousAlerts(page, limit);

    res.json(data);
  } catch (error) {
    logger.error("Get security alerts error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getAllResults = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });

    const results = await Promise.all(
      elections.map(async (election) => {
        const candidates = await Candidate.find({ electionId: election._id });
        const totalVotes = await Vote.countDocuments({ electionId: election._id });

        const candidateResults = await Promise.all(
          candidates.map(async (candidate) => {
            const voteCount = await Vote.countDocuments({
              electionId: election._id,
              candidateId: candidate._id,
            });
            return {
              id: candidate._id,
              name: candidate.name,
              party: candidate.party,
              voteCount,
            };
          })
        );

        candidateResults.sort((a, b) => b.voteCount - a.voteCount);

        return {
          election: election.toObject(),
          candidates: candidateResults,
          totalVotes,
        };
      })
    );

    res.json({ results });
  } catch (error) {
    logger.error("Get all results error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  toggleUserVerification,
  deleteUser,
  getSecurityAlerts,
  getAllResults,
};
