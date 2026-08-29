const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const logger = require("../utils/logger");

const getActiveElections = async (req, res) => {
  try {
    const elections = await Election.find({ status: "active" }).sort({
      startDate: -1,
    });

    const electionsWithCounts = await Promise.all(
      elections.map(async (election) => {
        const candidateCount = await Candidate.countDocuments({
          electionId: election._id,
        });
        const voteCount = await Vote.countDocuments({
          electionId: election._id,
        });
        return {
          ...election.toObject(),
          candidateCount,
          voteCount,
        };
      })
    );

    res.json({ elections: electionsWithCounts });
  } catch (error) {
    logger.error("Get active elections error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getVoterElectionDetails = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    election.updateStatus();

    const candidates = await Candidate.find({ electionId: election._id });
    const voteCount = await Vote.countDocuments({ electionId: election._id });

    const hasVoted = await Vote.findOne({
      voterId: req.user._id,
      electionId: election._id,
    });

    res.json({
      election,
      candidates,
      voteCount,
      hasVoted: !!hasVoted,
    });
  } catch (error) {
    logger.error("Get election details error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getVoterStats = async (req, res) => {
  try {
    const activeElections = await Election.countDocuments({ status: "active" });
    const totalElections = await Election.countDocuments();
    const votedElections = await Vote.countDocuments({ voterId: req.user._id });

    res.json({ activeElections, totalElections, votedElections });
  } catch (error) {
    logger.error("Get voter stats error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getActiveElections, getVoterElectionDetails, getVoterStats };
