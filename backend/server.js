require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Online Voting System API is running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/elections", require("./routes/elections"));
app.use("/api/candidates", require("./routes/candidates"));
app.use("/api/voter", require("./routes/voter"));
app.use("/api/votes", require("./routes/votes"));
app.use("/api/admin", require("./routes/admin"));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
