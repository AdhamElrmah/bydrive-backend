const jwt = require("jsonwebtoken");
const User =
  process.env.USE_MONGODB === "true" ? require("../models/User") : null;
const fs = require("fs");
const path = require("path");

const usersPath = path.join(__dirname, "..", "users.json");

// Helper function to read users from JSON
function readUsers() {
  if (!fs.existsSync(usersPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(usersPath, "utf8") || "[]");
  } catch {
    return [];
  }
}

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const secret = process.env.JWT_SECRET || "fallback_secret_key";
      const decoded = jwt.verify(token, secret);

      // Get user from token
      if (process.env.USE_MONGODB === "true" && User) {
        // MongoDB
        req.user = await User.findById(decoded.id).select("-passwordHash");
        if (!req.user) {
          return res.status(401).json({ error: "User not found" });
        }
      } else {
        // JSON fallback
        const users = readUsers();
        const user = users.find((u) => u.id == decoded.id || u._id == decoded.id);
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }
        // Remove password from user object
        const { passwordHash, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }
};

// Middleware to check if user is  admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Not authorized as admin" });
  }
};

module.exports = { protect, admin };
