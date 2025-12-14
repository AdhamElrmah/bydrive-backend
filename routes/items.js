/* eslint-env node */
/* global require, module */

const express = require("express");

const {
  addItem,
  listAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes - anyone can view cars
router.get("/allItems", listAllItems);
router.get("/:id", getItemById);

// Admin-only routes - require admin authentication
router.post("/", protect, admin, addItem);                // Admin adds cars
router.put("/:id", protect, admin, updateItem);           // Admin updates cars
router.delete("/:id", protect, admin, deleteItem);        // Admin deletes cars

module.exports = router;
