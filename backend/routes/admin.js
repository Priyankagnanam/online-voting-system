const express = require("express");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validateObjectId = require("../middleware/validateObjectId");
const {
  getDashboardStats,
  getUsers,
  toggleUserVerification,
  deleteUser,
  getSecurityAlerts,
  getAllResults,
  addApprovedVoters,
  getApprovedVoters,
  deleteApprovedVoter,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", auth, role("admin"), getDashboardStats);
router.get("/users", auth, role("admin"), getUsers);
router.patch("/users/:id/verify", auth, role("admin"), validateObjectId(), toggleUserVerification);
router.delete("/users/:id", auth, role("admin"), validateObjectId(), deleteUser);
router.get("/security-alerts", auth, role("admin"), getSecurityAlerts);
router.get("/results", auth, role("admin"), getAllResults);

// Approved Voters List Management
router.post("/approved-voters", auth, role("admin"), addApprovedVoters);
router.get("/approved-voters", auth, role("admin"), getApprovedVoters);
router.delete("/approved-voters/:id", auth, role("admin"), validateObjectId(), deleteApprovedVoter);

module.exports = router;
