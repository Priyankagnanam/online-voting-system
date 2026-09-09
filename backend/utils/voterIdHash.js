const crypto = require("crypto");

const computeVoterIdHash = (user, electionId, approvedVoter) => {
  const voterKey =
    user && user.rollNumber
      ? user.rollNumber
      : approvedVoter
        ? approvedVoter.rollNumber
        : user ? user._id.toString() : String(user);
  return crypto
    .createHash("sha256")
    .update(
      voterKey.toString().toUpperCase() +
        electionId.toString() +
        (process.env.JWT_SECRET || "secret-salt")
    )
    .digest("hex");
};

module.exports = computeVoterIdHash;