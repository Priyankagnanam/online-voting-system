const mongoose = require("mongoose");

const approvedVoterSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: [true, "Roll/Register Number is required"],
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
    default: "",
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: "",
  },
  isEligible: {
    type: Boolean,
    default: true,
  },
  votedElections: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ApprovedVoter", approvedVoterSchema);
