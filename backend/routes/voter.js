const express = require("express");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const {
  getActiveElections,
  getVoterElectionDetails,
  getVoterStats,
} = require("../controllers/voterController");

const router = express.Router();

router.get("/active-elections", auth, role("voter"), getActiveElections);
router.get("/stats", auth, role("voter"), getVoterStats);
router.get("/elections/:id", auth, role("voter"), getVoterElectionDetails);

module.exports = router;
