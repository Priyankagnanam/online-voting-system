const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error("Server will start but database features will not work.");
    console.error("Please install MongoDB or set MONGODB_URI in .env");
  }
};

const getDBStatus = () => isConnected;

module.exports = connectDB;
module.exports.getDBStatus = getDBStatus;
