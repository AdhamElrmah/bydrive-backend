/* eslint-env node */
/* global require, exports, __dirname, process */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User =
  process.env.USE_MONGODB === "true" ? require("../models/User") : null;
const { readJsonFile, writeJsonFile } = require("../utils/fileHelpers");

// Helper function to generate JWT token
function generateToken(userId, email) {
  const payload = { id: userId, email };
  const secret = process.env.JWT_SECRET || "fallback_secret_key";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      role,
      phoneNumber,
    } = req.body;
    if (!email || !password || !firstName || !lastName || !username) {
      return res.status(400).json({
        error: "firstName, lastName, username, email and password required",
      });
    }

    if (process.env.USE_MONGODB === "true" && User) {
      // MongoDB implementation
      const exists = await User.findOne({ email });
      if (exists) {
        return res
          .status(409)
          .json({ error: "User with this email already exists" });
      }
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(409).json({ error: "Username already taken" });
      }

      const user = await User.create({
        firstName,
        lastName,
        username,
        name: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        passwordHash: password, // Will be hashed by pre-save middleware
        role: role || "user",
      });

      const token = generateToken(user._id, user.email);
      const publicUser = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      };
      res.status(201).json({ user: publicUser, token });
    } else {
      // JSON fallback
      const users = readJsonFile("users.json");
      const exists = users.find((u) => u.email === email);
      if (exists) {
        return res
          .status(409)
          .json({ error: "User with this email already exists" });
      }
      const usernameExists = users.find((u) => u.username === username);
      if (usernameExists) {
        return res.status(409).json({ error: "Username already taken" });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const id = users.length ? users[users.length - 1].id + 1 : 1;
      const newUser = {
        id,
        id,
        firstName,
        lastName,
        username,
        name: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        passwordHash,
        role: role || "user",
      };
      users.push(newUser);
      writeJsonFile("users.json", users);

      const token = generateToken(newUser.id, newUser.email);
      const { passwordHash: _passwordHash, ...publicUser } = newUser;
      res.status(201).json({ user: publicUser, token });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email/Username and password required" });
    }

    if (process.env.USE_MONGODB === "true" && User) {
      // MongoDB implementation
      // Check if input is email or username
      const user = await User.findOne({
        $or: [{ email: email }, { username: email }],
      }).select("+passwordHash");

      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const ok = await user.matchPassword(password);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const token = generateToken(user._id, user.email);
      const publicUser = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      };
      res.status(200).json({ user: publicUser, token });
    } else {
      // JSON fallback
      const users = readJsonFile("users.json");
      const user = users.find((u) => u.email === email || u.username === email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const ok = bcrypt.compareSync(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });

      const token = generateToken(user.id, user.email);
      const { passwordHash: _passwordHash, ...publicUser } = user;
      res.status(200).json({ user: publicUser, token });
    }
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
