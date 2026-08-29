const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const logger = require('../utils/logger');

const createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const election = await Election.create({ title, description, startDate, endDate });

    logger.info('Election created', { electionId: election._id, title, requestId: req.id });
    res.status(201).json({ message: 'Election created', election });
  } catch (error) {
    logger.error('Create election error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

const getElections = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const elections = await Election.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Update status based on dates
    for (const election of elections) {
      election.updateStatus();
    }

    const total = await Election.countDocuments();

    res.json({
      elections,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Get elections error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

const getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    election.updateStatus();

    const candidates = await Candidate.find({ electionId: election._id });
    const totalVotes = await Vote.countDocuments({ electionId: election._id });

    res.json({ election, candidates, totalVotes });
  } catch (error) {
    logger.error('Get election error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

const updateElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, status } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Prevent changing dates of active elections with votes
    if (election.status === 'active') {
      const voteCount = await Vote.countDocuments({ electionId: election._id });
      if (voteCount > 0 && (startDate || endDate)) {
        return res.status(400).json({
          error: 'Cannot change dates of an active election with existing votes',
        });
      }
    }

    if (title !== undefined) election.title = title;
    if (description !== undefined) election.description = description;
    if (startDate !== undefined) election.startDate = startDate;
    if (endDate !== undefined) election.endDate = endDate;
    if (status !== undefined) election.status = status;

    await election.save();

    logger.info('Election updated', { electionId: election._id, requestId: req.id });
    res.json({ message: 'Election updated', election });
  } catch (error) {
    logger.error('Update election error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    if (election.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete an active election. End it first.' });
    }

    await Candidate.deleteMany({ electionId: election._id });
    await Vote.deleteMany({ electionId: election._id });
    await election.deleteOne();

    logger.info('Election deleted', { electionId: election._id, requestId: req.id });
    res.json({ message: 'Election deleted' });
  } catch (error) {
    logger.error('Delete election error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

const updateElectionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['upcoming', 'active', 'ended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }

    // Validate status transitions
    if (election.status === 'ended' && status === 'upcoming') {
      return res.status(400).json({ error: 'Cannot revert an ended election to upcoming' });
    }

    election.status = status;
    await election.save();

    logger.info('Election status changed', {
      electionId: election._id,
      oldStatus: election.status,
      newStatus: status,
      requestId: req.id,
    });
    res.json({ message: `Election status changed to ${status}`, election });
  } catch (error) {
    logger.error('Update election status error', { error: error.message, requestId: req.id });
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deleteElection,
  updateElectionStatus,
};
