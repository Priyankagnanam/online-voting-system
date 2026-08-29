const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validateObjectId = require("../middleware/validateObjectId");
const { castVote, getVoteResults } = require("../controllers/voteController");

const router = express.Router();

router.post(
  "/",
  auth,
  role("voter"),
  [
    body("electionId").isMongoId().withMessage("Valid election ID is required"),
    body("candidateId").isMongoId().withMessage("Valid candidate ID is required"),
  ],
  validate,
  castVote
);

router.get("/results/:electionId", auth, validateObjectId('electionId'), getVoteResults);

module.exports = router;
