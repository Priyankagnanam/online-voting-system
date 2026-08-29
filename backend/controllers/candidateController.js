const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const logger = require("../utils/logger");

const createCandidate = async (req, res) => {
  try {
    const { name, party, description, electionId } = req.body;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    const candidate = await Candidate.create({
      name,
      party,
      description,
      electionId,
    });

    res.status(201).json({ message: "Candidate added", candidate });
  } catch (error) {
    logger.error("Create candidate error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getCandidatesByElection = async (req, res) => {
  try {
    const candidates = await Candidate.find({ electionId: req.params.electionId });
    res.json({ candidates });
  } catch (error) {
    logger.error("Get candidates error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate("electionId", "title status")
      .sort({ createdAt: -1 });

    res.json({ candidates });
  } catch (error) {
    logger.error("Get all candidates error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate(
      "electionId",
      "title status startDate endDate"
    );

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json({ candidate });
  } catch (error) {
    logger.error("Get candidate error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { name, party, description } = req.body;

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (name !== undefined) candidate.name = name;
    if (party !== undefined) candidate.party = party;
    if (description !== undefined) candidate.description = description;

    await candidate.save();

    res.json({ message: "Candidate updated", candidate });
  } catch (error) {
    logger.error("Update candidate error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    await candidate.deleteOne();

    res.json({ message: "Candidate deleted" });
  } catch (error) {
    logger.error("Delete candidate error", { error: error.message, requestId: req.id });
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createCandidate,
  getCandidatesByElection,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
};
