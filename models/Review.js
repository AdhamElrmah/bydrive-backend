const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  carId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or string for backward compatibility
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true,
  },
  rentalId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 500,
    trim: true,
    default: "",
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: one review per user per car
reviewSchema.index({ carId: 1, userId: 1 }, { unique: true });

// Index for efficient queries
reviewSchema.index({ carId: 1, createdAt: -1 });

// Update the updatedAt timestamp on save
reviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
