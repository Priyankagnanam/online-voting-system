require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: "Admin",
      email: "admin@voting.com",
      passwordHash: "admin123",
      role: "admin",
      isVerified: true,
    });

    console.log("Admin user created:");
    console.log("  Email: admin@voting.com");
    console.log("  Password: admin123");
    console.log("  Role: admin");
    console.log("\nChange this password in production!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
