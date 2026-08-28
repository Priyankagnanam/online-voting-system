const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Candidate name is required"],
    trim: true,
    maxlength: 100,
  },
  party: {
    type: String,
    trim: true,
    maxlength: 100,
    default: "Independent",
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: [true, "Election ID is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

candidateSchema.index({ electionId: 1 });

module.exports = mongoose.model("Candidate", candidateSchema);
