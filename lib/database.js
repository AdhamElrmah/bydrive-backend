const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    if (process.env.USE_MONGODB === "true") {
      // Remove deprecated options
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ MongoDB Connected Successfully");
    } else {
      console.log("📁 Using JSON file storage");
    }
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    console.log("⚠️  Falling back to JSON file storage");
    // Don't exit, just log the error and continue with JSON
  }
};

module.exports = connectDB;
