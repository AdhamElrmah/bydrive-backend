/* eslint-env node */
/* global require, module */

const express = require("express");
const {
  rentItem,
  getUserRentals,
  cancelRental,
  getAllRentals,
  updateRental,
  checkCarAvailability,
  getBookingsForCar,
} = require("../controllers/rentalsController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post("/:id/availability", checkCarAvailability);
router.get("/:id/bookings", getBookingsForCar);

// Protected routes
router.post("/:id", protect, rentItem); // User rents a car
router.get("/user", protect, getUserRentals); // User views their rentals
router.delete("/:id", protect, cancelRental); // User cancels their rental

// Admin-only routes
router.get("/all", protect, admin, getAllRentals); // Admin views all rentals
router.put("/:id", protect, admin, updateRental); // Admin updates rentals

module.exports = router;
