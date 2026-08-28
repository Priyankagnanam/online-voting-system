const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");

const createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
    });

    res.status(201).json({ message: "Election created", election });
  } catch (error) {
    console.error("Create election error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });

    for (const election of elections) {
      election.updateStatus();
    }

    res.json({ elections });
  } catch (error) {
    console.error("Get elections error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    election.updateStatus();

    const candidates = await Candidate.find({ electionId: election._id });
    const totalVotes = await Vote.countDocuments({ electionId: election._id });

    res.json({ election, candidates, totalVotes });
  } catch (error) {
    console.error("Get election error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const updateElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, status } = req.body;

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    if (title !== undefined) election.title = title;
    if (description !== undefined) election.description = description;
    if (startDate !== undefined) election.startDate = startDate;
    if (endDate !== undefined) election.endDate = endDate;
    if (status !== undefined) election.status = status;

    await election.save();

    res.json({ message: "Election updated", election });
  } catch (error) {
    console.error("Update election error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    if (election.status === "active") {
      return res.status(400).json({ error: "Cannot delete an active election. End it first." });
    }

    await Candidate.deleteMany({ electionId: election._id });
    await Vote.deleteMany({ electionId: election._id });
    await election.deleteOne();

    res.json({ message: "Election deleted" });
  } catch (error) {
    console.error("Delete election error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

const updateElectionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["upcoming", "active", "ended"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ error: "Election not found" });
    }

    election.status = status;
    await election.save();

    res.json({ message: `Election status changed to ${status}`, election });
  } catch (error) {
    console.error("Update election status error:", error.message);
    res.status(500).json({ error: "Server error" });
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
