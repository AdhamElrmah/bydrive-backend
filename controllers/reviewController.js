const Review = require("../models/Review");
const Rental = require("../models/Rental");
const Car = require("../models/Car");
const mongoose = require("mongoose");

// Helper function to check if user has completed rental for a car
const hasCompletedRental = async (userId, carId) => {
  try {
    const rental = await Rental.findOne({
      userId: userId,
      carId: carId,
      status: "completed",
    });
    return !!rental;
  } catch (error) {
    console.error("Error checking completed rental:", error);
    return false;
  }
};

// Helper function to calculate average rating for a car
const calculateAverageRating = async (carId) => {
  try {
    const reviews = await Review.find({ carId: carId });
    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return {
      average: Math.round((sum / reviews.length) * 10) / 10, // Round to 1 decimal
      count: reviews.length,
    };
  } catch (error) {
    console.error("Error calculating average rating:", error);
    return { average: 0, count: 0 };
  }
};

// Create a new review
const createReview = async (req, res) => {
  try {
    const { carId, rating, comment } = req.body;
    const userId = req.user.id || req.user._id;
    const username = req.user.username || req.user.name;

    // Validation
    if (!carId || !rating) {
      return res.status(400).json({ error: "Car ID and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if user has completed a rental for this car
    const hasRented = await hasCompletedRental(userId, carId);
    if (!hasRented) {
      return res.status(403).json({
        error: "You can only review cars you have rented and completed",
      });
    }

    // Check for existing review
    const existingReview = await Review.findOne({ carId, userId });
    if (existingReview) {
      return res.status(400).json({
        error: "You have already reviewed this car. Use update instead.",
      });
    }

    // Find the rental to link
    const rental = await Rental.findOne({
      userId: userId,
      carId: carId,
      status: "completed",
    });

    // Create review
    const review = await Review.create({
      carId,
      userId,
      rentalId: rental._id || rental.id,
      rating: Number(rating),
      comment: comment || "",
      username,
    });

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this car" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// Get all reviews for a specific car
const getCarReviews = async (req, res) => {
  try {
    const { carId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ carId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ carId });
    const stats = await calculateAverageRating(carId);

    res.status(200).json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Get car reviews error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all reviews by a specific user
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const reviews = await Review.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id || req.user._id;

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check ownership
    if (review.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only update your own reviews" });
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Update
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment;

    await review.save();

    res.status(200).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;

    // Find review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check ownership or admin
    if (
      review.userId.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this review" });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Check if user can review a car
const checkReviewEligibility = async (req, res) => {
  try {
    const { carId } = req.params;
    const userId = req.user.id || req.user._id;

    // Check if has completed rental
    const hasRented = await hasCompletedRental(userId, carId);

    // Check if already reviewed
    const existingReview = await Review.findOne({ carId, userId });

    const response = {
      canReview: hasRented && !existingReview,
      hasRented,
      hasReviewed: !!existingReview,
      existingReview: existingReview || null,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Check review eligibility error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all reviews (Admin only)
const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({});

    res.status(200).json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createReview,
  getCarReviews,
  getUserReviews,
  getAllReviews,
  updateReview,
  deleteReview,
  checkReviewEligibility,
};
