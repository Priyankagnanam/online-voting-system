const crypto = require('crypto');
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const logger = require('../utils/logger');
const computeVoterIdHash = require('../utils/voterIdHash');

const ApprovedVoter = require('../models/ApprovedVoter');

const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const voterId = req.user._id;
    const user = req.user;

    // 1. Voter must be approved (server-side enforcement — never trusts client flags)
    if (user.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        error: user.approvalStatus === 'REJECTED'
          ? 'Your registration has not been approved.'
          : 'Your registration is awaiting admin approval.',
        approvalStatus: user.approvalStatus,
      });
    }

    // 2. Voter must have completed OTP email verification before voting
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first.' });
    }

    // 3. Verify election exists
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // 4. Verify election is active (both status AND date-based)
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

    // 5. Verify voter has not already voted in this election
    if (user.votedElections && user.votedElections.some(id => id.toString() === electionId.toString())) {
      return res.status(400).json({ error: 'You have already voted.' });
    }

    // 6. Verify candidate exists AND belongs to this election
    const candidate = await Candidate.findOne({ _id: candidateId, electionId });
    if (!candidate) {
      return res.status(400).json({ error: 'Invalid candidate for this election' });
    }

    // 7. Pre-registered voter & eligibility check on backend (existing functionality preserved)
    const approvedCount = await ApprovedVoter.countDocuments();
    let approvedVoter = null;
    if (approvedCount > 0) {
      const conditions = [];
      if (user.rollNumber) conditions.push({ rollNumber: user.rollNumber });
      if (user.email) conditions.push({ email: user.email.toLowerCase() });

      approvedVoter = await ApprovedVoter.findOne({ $or: conditions });
      if (!approvedVoter || approvedVoter.isEligible === false) {
        return res.status(400).json({ error: 'You are not registered as an eligible voter.' });
      }

      if (approvedVoter.votedElections && approvedVoter.votedElections.some(id => id.toString() === electionId.toString())) {
        return res.status(400).json({ error: 'You have already voted.' });
      }
    }

    // 8. Generate deterministic voterIdHash based on Roll Number / Student ID (or User ID fallback)
    const voterIdHash = computeVoterIdHash(user, electionId, approvedVoter);

    // 9. Check if already voted (application-level check)
    const existingVote = await Vote.findOne({ voterIdHash, electionId });
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted.' });
    }

    // 10. Generate secure random receipt hash for vote audit/verifiability
    const receiptHash = crypto.randomBytes(16).toString('hex');

    // 11. Cast vote atomically in DB (unique index on voterIdHash+electionId prevents races)
    const vote = await Vote.create({ voterIdHash, electionId, candidateId, receiptHash });

    // 12. Atomically update voter's votedElections state across User and ApprovedVoter tables
    await User.findByIdAndUpdate(voterId, {
      $addToSet: { votedElections: electionId },
    });

    if (approvedVoter) {
      await ApprovedVoter.findByIdAndUpdate(approvedVoter._id, {
        $addToSet: { votedElections: electionId },
      });
    }

    logger.info('Vote cast', {
      electionId: electionId.toString(),
      requestId: req.id,
    });

    // Emit live WebSocket update
    const io = req.app.get('io');
    if (io) {
      io.emit('voteCast', { electionId: electionId.toString() });
    }

    res.status(201).json({
      message: 'Vote cast successfully',
      vote: {
        electionId: vote.electionId,
        candidateId: vote.candidateId,
        receiptHash: vote.receiptHash,
        createdAt: vote.createdAt,
      },
    });
  } catch (error) {
    // Handle duplicate key error (database-level duplicate vote prevention)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You have already voted.' });
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
