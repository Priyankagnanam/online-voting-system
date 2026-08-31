const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  voterIdHash: {
    type: String,
    required: [true, "Voter ID hash is required"],
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
  receiptHash: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

voteSchema.index({ voterIdHash: 1, electionId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
