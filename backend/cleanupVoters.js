require("dotenv").config();
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  const voters = await db.collection("users").find({ role: { $ne: "admin" } }).toArray();
  const voterIds = voters.map((u) => u._id);
  const emails = voters.map((u) => u.email);

  if (voterIds.length === 0) {
    console.log("No voters found to delete.");
    process.exit(0);
  }

  const delUsers = await db.collection("users").deleteMany({ _id: { $in: voterIds } });
  const delVotes = await db.collection("votes").deleteMany({ voterId: { $in: voterIds } });
  const delOtps = await db.collection("otps").deleteMany({ email: { $in: emails } });
  const delLogins = await db.collection("loginattempts").deleteMany({ email: { $in: emails } });

  console.log("Deleted voters:", delUsers.deletedCount);
  console.log("Deleted votes:", delVotes.deletedCount);
  console.log("Deleted otps:", delOtps.deletedCount);
  console.log("Deleted loginattempts:", delLogins.deletedCount);

  const remaining = await db
    .collection("users")
    .find({}, { projection: { email: 1, role: 1 } })
    .toArray();
  console.log("Remaining users:", remaining.map((u) => `${u.email} (${u.role})`).join(", "));

  process.exit(0);
};

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});