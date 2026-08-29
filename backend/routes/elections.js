const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validateObjectId = require("../middleware/validateObjectId");
const {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deleteElection,
  updateElectionStatus,
} = require("../controllers/electionController");

const router = express.Router();

router.get("/", auth, getElections);
router.get("/:id", auth, validateObjectId(), getElectionById);

router.post(
  "/",
  auth,
  role("admin"),
  [
    body("title").trim().isLength({ min: 1 }).withMessage("Title is required"),
    body("startDate").isISO8601().withMessage("Valid start date is required"),
    body("endDate").isISO8601().withMessage("Valid end date is required"),
  ],
  validate,
  createElection
);

router.put(
  "/:id",
  auth,
  role("admin"),
  validateObjectId(),
  updateElection
);

router.delete(
  "/:id",
  auth,
  role("admin"),
  validateObjectId(),
  deleteElection
);

router.patch(
  "/:id/status",
  auth,
  role("admin"),
  validateObjectId(),
  [body("status").isIn(["upcoming", "active", "ended"]).withMessage("Invalid status")],
  validate,
  updateElectionStatus
);

module.exports = router;
