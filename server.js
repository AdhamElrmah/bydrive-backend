const express = require("express");
const cors = require("cors");
const connectDB = require("./lib/database");
const seedDatabase = require("./scripts/seed");

require("dotenv").config();

// Connect to database and seed if needed
connectDB()
  .then(() => {
    // Seed database with initial data if empty
    if (process.env.SEED_ON_STARTUP === "true") {
      return seedDatabase();
    }
  })
  .catch((error) => {
    console.error("Database connection/seeding error:", error);
  });

const app = express();

// CORS configuration - FIX FOR VITE
const corsOptions = {
  origin: [
    "http://localhost:3000", // React default
    "http://localhost:5173", // Vite default
    "http://localhost:3001", // Alternative
    "https://depi-final-project-frontend.netlify.app",
    "https://www.depi-final-project-frontend.netlify.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// Routes
const items = require("./routes/items");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");
const rentals = require("./routes/rentals");

app.use("/items", items);
app.use("/auth", auth);
app.use("/users", users);
app.use("/reviews", reviews);
app.use("/rentals", rentals);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    environment: process.env.NODE_ENV,
    database: process.env.USE_MONGODB === "true" ? "MongoDB" : "JSON Files",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(
      `CORS enabled for: http://localhost:3000, http://localhost:5173, http://localhost:3001`
    );
    console.log(
      `Database: ${
        process.env.USE_MONGODB === "true" ? "MongoDB" : "JSON Files"
      }`
    );
  });
}

module.exports = app;
