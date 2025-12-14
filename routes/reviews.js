const express = require("express");
const router = express.Router();
const { protect ,admin} = require("../middleware/authMiddleware");
const {
  createReview,
  getCarReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  checkReviewEligibility,
  getAllReviews,
} = require("../controllers/reviewController");

// Public routes
router.get("/car/:carId", getCarReviews);

// Protected routes
router.post("/", protect, createReview);
router.get("/user", protect, getUserReviews);
router.get("/eligibility/:carId", protect, checkReviewEligibility);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

// Admin routes
router.get("/all", protect, admin, getAllReviews);

module.exports = router;
