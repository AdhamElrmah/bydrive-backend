const mongoose = require("mongoose");

const carSchema = new mongoose.Schema({
  // Original fields
  id: {
    type: String,
    required: true,
    unique: true,
  },
  make: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
  },
  overview: {
    type: String,
  },
  body_type: {
    type: String,
    required: true,
    trim: true,
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
  },
  fuel_consumption: {
    type: String,
  },

  // Engine object
  engine: {
    type: {
      type: String,
      trim: true,
    },
    displacement: {
      type: String,
      trim: true,
    },
    configuration: {
      type: String,
      trim: true,
    },
    power_hp: {
      type: Number,
      min: 0,
    },
  },

  // Transmission with flexible validation
  transmission: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        const validTypes = [
          "automatic",
          "manual",
          "cvt",
          "dct",
          "amt",
          "direct drive",
          "Automatic",
          "Manual",
          "CVT",
          "DCT",
          "AMT",
          "Direct Drive",
          // Add any other transmission types from your data
        ];
        return validTypes.includes(v) || v; // Allow any string for now
      },
      message: (props) => `${props.value} is not a valid transmission type.`,
    },
    set: function (v) {
      return v ? v.toLowerCase() : v;
    },
  },

  drivetrain: {
    type: String,
    trim: true,
  },
  fuel_type: {
    type: String,
    required: true,
    trim: true,
  },

  // Colors object
  colors: {
    exterior: {
      type: String,
    },
    interior: {
      type: String,
    },
  },

  // Features arrays
  primary_features: [
    {
      type: String,
      trim: true,
    },
  ],
  additional_features: [
    {
      type: String,
      trim: true,
    },
  ],

  // Images object
  images: {
    main: {
      type: String,
    },
    sub1: {
      type: String,
    },
    sub2: {
      type: String,
    },
    sub3: {
      type: String,
    },
    sub4: {
      type: String,
    },
  },

  // Pricing
  price_per_day: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "USD",
  },

  // Rental information
  rental_conditions: {
    type: String,
  },
  rental_class: {
    type: String,
  },

  // System fields
  available: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for better queries
carSchema.index({ make: 1, model: 1, year: 1 });
carSchema.index({ rental_class: 1 });
carSchema.index({ available: 1 });

module.exports = mongoose.model("Car", carSchema);
