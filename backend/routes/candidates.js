const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validateObjectId = require("../middleware/validateObjectId");
const {
  createCandidate,
  getCandidatesByElection,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController");

const router = express.Router();

router.get("/", auth, getAllCandidates);
router.get("/by-election/:electionId", auth, validateObjectId('electionId'), getCandidatesByElection);
router.get("/:id", auth, validateObjectId(), getCandidateById);

router.post(
  "/",
  auth,
  role("admin"),
  [
    body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
    body("electionId").isMongoId().withMessage("Valid election ID is required"),
  ],
  validate,
  createCandidate
);

router.put(
  "/:id",
  auth,
  role("admin"),
  validateObjectId(),
  updateCandidate
);

router.delete(
  "/:id",
  auth,
  role("admin"),
  validateObjectId(),
  deleteCandidate
);

module.exports = router;
