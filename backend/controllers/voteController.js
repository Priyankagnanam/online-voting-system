const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const logger = require('../utils/logger');

const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const voterId = req.user._id;

    // 1. Verify election exists
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // 2. Verify election is active (both status AND date-based)
    const now = new Date();
    if (election.status !== 'active') {
      return res.status(400).json({ error: 'This election is not currently active' });
    }
    if (now < election.startDate) {
      return res.status(400).json({ error: 'This election has not started yet' });
    }
    if (now > election.endDate) {
      return res.status(400).json({ error: 'This election has ended' });
    }

    // 3. Verify candidate exists AND belongs to this election
    const candidate = await Candidate.findOne({ _id: candidateId, electionId });
    if (!candidate) {
      return res.status(400).json({ error: 'Invalid candidate for this election' });
    }

    // 4. Check if already voted (application-level check)
    const existingVote = await Vote.findOne({ voterId, electionId });
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted in this election' });
    }

    // 5. Cast vote atomically
    const vote = await Vote.create({ voterId, electionId, candidateId });

    // 6. Update user's voted elections list
    await User.findByIdAndUpdate(voterId, {
      $addToSet: { votedElections: electionId },
    });

    logger.info('Vote cast', {
      voterId: voterId.toString(),
      electionId: electionId.toString(),
      requestId: req.id,
    });

    res.status(201).json({
      message: 'Vote cast successfully',
      vote: {
        electionId: vote.electionId,
        candidateId: vote.candidateId,
        createdAt: vote.createdAt,
      },
    });
  } catch (error) {
    // Handle duplicate key error (database-level duplicate vote prevention)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already voted in this election' });
    }
    logger.error('Cast vote error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

const getVoteResults = async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
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
    logger.error('Get results error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { castVote, getVoteResults };
