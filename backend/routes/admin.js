const express = require("express");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const {
  getDashboardStats,
  getUsers,
  toggleUserVerification,
  deleteUser,
  getSecurityAlerts,
  getAllResults,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/dashboard", auth, role("admin"), getDashboardStats);
router.get("/users", auth, role("admin"), getUsers);
router.patch("/users/:id/verify", auth, role("admin"), toggleUserVerification);
router.delete("/users/:id", auth, role("admin"), deleteUser);
router.get("/security-alerts", auth, role("admin"), getSecurityAlerts);
router.get("/results", auth, role("admin"), getAllResults);

module.exports = router;
