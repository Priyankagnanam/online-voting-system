const User = require("../models/User");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const ApprovedVoter = require("../models/ApprovedVoter");
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
    const totalApprovedVoters = await ApprovedVoter.countDocuments();

    res.json({
      totalVoters,
      totalElections,
      totalCandidates,
      totalVotes,
      activeElections,
      security,
      totalApprovedVoters,
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

    // Since Vote doesn't contain voterId directly anymore, we find votes by calculating their voterIdHash
    // and deleting them from the elections they voted in.
    // Or simpler: we delete their user record, and their votes stay anonymous!
    // That is the beauty of anonymity. If a user is deleted, their anonymous vote remains intact and doesn't get destroyed!
    // But they can never vote again. This is standard for auditability.
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

// Approved Voters List Management
const addApprovedVoters = async (req, res) => {
  try {
    const { voters } = req.body; // Array of objects [{ rollNumber, name, email }] or string lines
    if (!Array.isArray(voters)) {
      return res.status(400).json({ error: "Voters list must be an array of objects or strings" });
    }

    const docs = voters
      .map(item => {
        if (typeof item === 'string') {
          const parts = item.split(',').map(s => s.trim());
          // format: rollNumber, name, email OR rollNumber/email
          if (parts.length >= 3) {
            return { rollNumber: parts[0].toUpperCase(), name: parts[1], email: parts[2].toLowerCase() };
          }
          if (parts[0].includes('@')) {
            return { rollNumber: parts[0].split('@')[0].toUpperCase(), email: parts[0].toLowerCase() };
          }
          return { rollNumber: parts[0].toUpperCase() };
        }
        if (typeof item === 'object' && item !== null) {
          const rollNumber = item.rollNumber ? item.rollNumber.toString().trim().toUpperCase() : "";
          const email = item.email ? item.email.toString().trim().toLowerCase() : "";
          const name = item.name ? item.name.toString().trim() : "";
          if (rollNumber || email) {
            return {
              rollNumber: rollNumber || (email ? email.split('@')[0].toUpperCase() : ""),
              name,
              email,
              isEligible: item.isEligible !== undefined ? Boolean(item.isEligible) : true,
            };
          }
        }
        return null;
      })
      .filter(doc => doc && doc.rollNumber);

    if (docs.length === 0) {
      return res.status(400).json({ error: "No valid voter Roll/Register Numbers found in the request" });
    }

    let createdCount = 0;
    try {
      const result = await ApprovedVoter.insertMany(docs, { ordered: false });
      createdCount = result.length;
    } catch (err) {
      if (err.writeErrors) {
        createdCount = docs.length - err.writeErrors.length;
      } else {
        throw err;
      }
    }

    res.status(201).json({ message: `${createdCount} eligible student voters registered successfully.` });
  } catch (error) {
    logger.error("Add approved voters error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getApprovedVoters = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const query = search
      ? {
          $or: [
            { rollNumber: { $regex: escapedSearch, $options: "i" } },
            { name: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } },
          ],
        }
      : {};

    const voters = await ApprovedVoter.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ApprovedVoter.countDocuments(query);

    res.json({
      voters,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("Get approved voters error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const toggleApprovedVoterEligibility = async (req, res) => {
  try {
    const voter = await ApprovedVoter.findById(req.params.id);
    if (!voter) {
      return res.status(404).json({ error: "Eligible voter record not found" });
    }

    voter.isEligible = !voter.isEligible;
    await voter.save();

    res.json({
      message: `Voter eligibility updated to ${voter.isEligible ? 'Eligible' : 'Ineligible'}`,
      voter,
    });
  } catch (error) {
    logger.error("Toggle voter eligibility error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const deleteApprovedVoter = async (req, res) => {
  try {
    const voter = await ApprovedVoter.findById(req.params.id);
    if (!voter) {
      return res.status(404).json({ error: "Voter not found in list" });
    }

    await voter.deleteOne();
    res.json({ message: "Voter removed from pre-approved list" });
  } catch (error) {
    logger.error("Delete approved voter error", { error: error.message, requestId: req.id });
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
  addApprovedVoters,
  getApprovedVoters,
  toggleApprovedVoterEligibility,
  deleteApprovedVoter,
};
