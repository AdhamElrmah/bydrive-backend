const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    sparse: true, // Allow null values for uniqueness
  },

  carId: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or number for backward compatibility
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  startDate: {
    type: String, // Keep as string for backward compatibility
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  pickupLocation: {
    type: String,
    default: "Default Location",
  },
  dropoffLocation: {
    type: String,
    default: "Default Location",
  },
  specialRequests: {
    type: String,
    default: "",
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
  },
  paymentInfo: {
    method: String,
    cardNumber: String,
    cardName: String,
    expirationDate: String,
    cvc: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient availability checks
rentalSchema.index({ carId: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Rental", rentalSchema);
