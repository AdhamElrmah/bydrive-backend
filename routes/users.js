/* eslint-env node */
/* global require, module */

const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// All user routes require authentication
router.get("/", protect, admin, getAllUsers);           // Admin only - view all users
router.get("/:userId", protect, getUserById);           // User can view their own profile
router.post("/", createUser);                           // Public - user registration
router.put("/:userId", protect, updateUser);            // User can update their profile
router.delete("/:userId", protect, admin, deleteUser);  // Admin only - delete users

module.exports = router;
