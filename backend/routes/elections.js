const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
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
router.get("/:id", auth, getElectionById);

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
  updateElection
);

router.delete(
  "/:id",
  auth,
  role("admin"),
  deleteElection
);

router.patch(
  "/:id/status",
  auth,
  role("admin"),
  [body("status").isIn(["upcoming", "active", "ended"]).withMessage("Invalid status")],
  validate,
  updateElectionStatus
);

module.exports = router;
