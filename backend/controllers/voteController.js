const Vote = require("../models/Vote");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const User = require("../models/User");

const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const voterId = req.user._id;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    if (election.status !== "active") {
      return res.status(400).json({ error: "This election is not currently active" });
    }

    const candidate = await Candidate.findOne({ _id: candidateId, electionId });
    if (!candidate) {
      return res.status(400).json({ error: "Invalid candidate for this election" });
    }

    const existingVote = await Vote.findOne({ voterId, electionId });
    if (existingVote) {
      return res.status(400).json({ error: "You have already voted in this election" });
    }

    const vote = await Vote.create({ voterId, electionId, candidateId });

    await User.findByIdAndUpdate(voterId, {
      $addToSet: { votedElections: electionId },
    });

    res.status(201).json({
      message: "Vote cast successfully",
      vote: {
        electionId: vote.electionId,
        candidateId: vote.candidateId,
        createdAt: vote.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "You have already voted in this election" });
    }
    console.error("Cast vote error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getVoteResults = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    const candidates = await Candidate.find({ electionId });

    const results = await Promise.all(
      candidates.map(async (candidate) => {
        const voteCount = await Vote.countDocuments({ electionId, candidateId: candidate._id });
        return {
          candidate: {
            id: candidate._id,
            name: candidate.name,
            party: candidate.party,
          },
          voteCount,
        };
      })
    );

    results.sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);

    res.json({ election, results, totalVotes });
  } catch (error) {
    console.error("Get results error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { castVote, getVoteResults };
