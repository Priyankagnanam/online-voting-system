const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Voter ID is required"],
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: [true, "Election ID is required"],
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: [true, "Candidate ID is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

voteSchema.index({ voterId: 1, electionId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
