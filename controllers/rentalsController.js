/* eslint-env node */
/* global require, module process __dirname*/

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Car =
  process.env.USE_MONGODB === "true" ? require("../models/Car") : null;
const Rental =
  process.env.USE_MONGODB === "true" ? require("../models/Rental") : null;
const User =
  process.env.USE_MONGODB === "true" ? require("../models/User") : null;

const { readJsonFile, writeJsonFile } = require("../utils/fileHelpers");

// Helper function to verify JWT and get user email
function verifyToken(token) {
  try {
    const secret = process.env.JWT_SECRET || "fallback_secret_key";
    const decoded = jwt.verify(token, secret);
    return decoded.email;
  } catch (error) {
    return null;
  }
}

const checkCarAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start date and end date are required" });
    }

    if (process.env.USE_MONGODB === "true" && Rental) {
      const isOverlapping = await Rental.findOne({
        carId: id,
        status: "active",
        $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
      });

      res.status(200).json({
        available: !isOverlapping,
        car: { id },
      });
    } else {
      const rentals = readJsonFile("rentItem.json");
      const isOverlapping = rentals.some(
        (rental) =>
          rental.carId == id &&
          rental.status === "active" &&
          rental.startDate <= endDate &&
          rental.endDate >= startDate
      );

      res.status(200).json({
        available: !isOverlapping,
        car: { id },
      });
    }
  } catch (err) {
    console.error("Availability check error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const rentItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      pickupLocation,
      dropoffLocation,
      specialRequests,
      paymentInfo,
    } = req.body;

    // Get current user from token
    const auth = req.headers.authorization || "";
    const token = auth.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const currentUserEmail = verifyToken(token);
    if (!currentUserEmail)
      return res.status(401).json({ error: "Unauthorized" });
    let currentUser;

    if (process.env.USE_MONGODB === "true" && User) {
      currentUser = await User.findOne({ email: currentUserEmail });
    } else {
      const users = readJsonFile("users.json");
      currentUser = users.find((u) => u.email === currentUserEmail);
    }

    if (!currentUser) return res.status(401).json({ error: "Unauthorized" });

    // Find car with multiple ID type support
    let car;
    if (process.env.USE_MONGODB === "true" && Car) {
      // Try different ways to find the car
      if (mongoose.Types.ObjectId.isValid(id)) {
        car = await Car.findById(id);
      } else {
        car =
          (await Car.findOne({ id: id })) ||
          (await Car.findOne({ id: parseInt(id) }));
      }
    } else {
      const cars = readJsonFile("cars.json");
      car = cars.find((c) => c.id == id);
    }

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    // Check availability with proper car ID handling
    let isOverlapping;
    if (process.env.USE_MONGODB === "true" && Rental) {
      // Get the correct car ID for database lookup
      const carIdForLookup = car._id || car.id;

      isOverlapping = await Rental.findOne({
        carId: carIdForLookup,
        status: "active",
        $or: [{ startDate: { $lte: endDate }, endDate: { $gte: startDate } }],
      });
    } else {
      const rentals = readJsonFile("rentItem.json");
      isOverlapping = rentals.some(
        (rental) =>
          rental.carId == id &&
          rental.status === "active" &&
          rental.startDate <= endDate &&
          rental.endDate >= startDate
      );
    }

    if (isOverlapping) {
      return res
        .status(400)
        .json({ error: "Car is already rented for the selected dates" });
    }

    // Calculate pricing
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = days * (car.price_per_day || car.pricePerDay);

    if (process.env.USE_MONGODB === "true" && Rental) {
      // Create rental with OLD FORMAT (matching JSON structure)
      const rentalId = Date.now().toString(); // Generate timestamp-based ID like old rentals

      const rental = new Rental({
        id: rentalId, // Add custom ID field like old rentals
        carId: car.id || car._id, // Use car's custom id, fallback to _id
        userId: currentUser.id || currentUser._id, // Use user's custom id, fallback to _id
        userEmail: currentUser.email || currentUserEmail,
        username: currentUser.username,
        startDate,
        endDate,
        pickupLocation: pickupLocation || "Default Location",
        dropoffLocation: dropoffLocation || "Default Location",
        specialRequests: specialRequests || "",
        totalDays: days,
        pricePerDay: car.price_per_day || car.pricePerDay,
        totalPrice,
        paymentInfo,
        status: "active",
      });

      await rental.save();

      res.status(200).json({
        message: "Car rented successfully",
        rental: {
          ...rental.toObject(),
          car: car,
        },
      });
    } else {
      const rentals = readJsonFile("rentItem.json");
      const rentalId = Date.now().toString();
      const rentalData = {
        id: rentalId,
        carId: car.id,
        userId: currentUser.id,
        userEmail: currentUserEmail,
        username: currentUser.username,
        startDate,
        endDate,
        pickupLocation: pickupLocation || "Default Location",
        dropoffLocation: dropoffLocation || "Default Location",
        specialRequests: specialRequests || "",
        totalDays: days,
        pricePerDay: car.price_per_day,
        totalPrice,
        status: "active",
        paymentInfo,
        createdAt: new Date().toISOString(),
      };

      rentals.push(rentalData);
      writeJsonFile("rentItem.json", rentals);

      res.status(200).json({
        message: "Car rented successfully",
        rental: {
          ...rentalData,
          car: car,
        },
      });
    }
  } catch (error) {
    console.error("Rental error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserRentals = async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const currentUserEmail = verifyToken(token);
    if (!currentUserEmail)
      return res.status(401).json({ error: "Unauthorized" });

    if (process.env.USE_MONGODB === "true" && Rental && User && Car) {
      const user = await User.findOne({ email: currentUserEmail });
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      // Find rentals - handle both ObjectId and string userId
      const rentals = await Rental.find({
        $or: [
          { userId: user._id }, // ObjectId match
          { userId: user.id }, // String ID match
          { userId: parseInt(user.id) }, // Number ID match
          { userEmail: currentUserEmail }, // Fallback to email
        ],
      });

      // Populate car data for each rental
      const rentalsWithCars = await Promise.all(
        rentals.map(async (rental) => {
          let carData = null;

          // Try to find car by different ID types
          if (mongoose.Types.ObjectId.isValid(rental.carId)) {
            carData = await Car.findById(rental.carId);
          } else {
            carData =
              (await Car.findOne({ id: rental.carId })) ||
              (await Car.findOne({ id: parseInt(rental.carId) }));
          }

          return {
            ...rental.toObject(),
            car: carData,
          };
        })
      );

      res.status(200).json(rentalsWithCars);
    } else {
      // JSON fallback
      const rentals = readJsonFile("rentItem.json");
      const userRentals = rentals.filter(
        (r) => r.userEmail === currentUserEmail
      );
      res.status(200).json(userRentals);
    }
  } catch (error) {
    console.error("Get user rentals error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const cancelRental = async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const currentUserEmail = verifyToken(token);
    if (!currentUserEmail)
      return res.status(401).json({ error: "Unauthorized" });

    if (process.env.USE_MONGODB === "true" && Rental && User) {
      const user = await User.findOne({ email: currentUserEmail });
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      // Try to find rental by different ID types
      let rental = null;

      // 1. Try by MongoDB _id (for new rentals)
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        rental = await Rental.findById(req.params.id);
        if (rental) {
          console.log("Found rental by MongoDB _id");
        }
      }

      // 2. Try by id field as string (for old rentals)
      if (!rental) {
        rental = await Rental.findOne({ id: req.params.id });
        if (rental) {
          console.log("Found rental by id field (string)");
        }
      }

      // 3. Try by id field as number (for old rentals)
      if (!rental) {
        rental = await Rental.findOne({ id: parseInt(req.params.id) });
        if (rental) {
          console.log("Found rental by id field (number)");
        }
      }

      if (!rental) {
        console.log("Rental not found with ID:", req.params.id);
        return res.status(404).json({ error: "Rental not found" });
      }

      // Check authorization - handle both ObjectId and string userId
      const rentalUserId = rental.userId;
      const currentUserId = user._id || user.id;

      // Allow admin to cancel any rental, or user to cancel their own rental
      const isAuthorized =
        user.role === "admin" || // Admin can cancel any rental
        rentalUserId.toString() === currentUserId.toString() ||
        rentalUserId === currentUserId ||
        rental.userEmail === currentUserEmail;

      if (!isAuthorized) {
        return res
          .status(403)
          .json({ error: "Not authorized to cancel this rental" });
      }

      rental.status = "cancelled";
      await rental.save();

      res.status(200).json({ message: "Rental cancelled successfully" });
    } else {
      // JSON fallback
      const rentals = readJsonFile("rentItem.json");
      const rentalIndex = rentals.findIndex((r) => r.id == req.params.id);
      if (rentalIndex === -1) {
        return res.status(404).json({ error: "Rental not found" });
      }

      const rental = rentals[rentalIndex];
      if (rental.userEmail !== currentUserEmail) {
        return res
          .status(403)
          .json({ error: "Not authorized to cancel this rental" });
      }

      rental.status = "cancelled";
      writeJsonFile("rentItem.json", rentals);

      res.status(200).json({ message: "Rental cancelled successfully" });
    }
  } catch (error) {
    console.error("Cancel rental error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getAllRentals = async (req, res) => {
  try {
    if (process.env.USE_MONGODB === "true" && Rental && Car && User) {
      console.log("Fetching all rentals...");
      const rentals = await Rental.find();
      console.log(`Found ${rentals.length} rentals`);

      // Populate car and user data manually with error handling
      const rentalsWithData = [];

      for (const rental of rentals) {
        try {
          let carData = null;
          let userData = null;

          // Find car data with null checks
          if (rental.carId) {
            if (
              typeof rental.carId === "string" &&
              mongoose.Types.ObjectId.isValid(rental.carId)
            ) {
              carData = await Car.findById(rental.carId);
            } else {
              const carIdToSearch =
                typeof rental.carId === "string"
                  ? rental.carId
                  : rental.carId.toString();
              carData =
                (await Car.findOne({ id: carIdToSearch })) ||
                (await Car.findOne({ id: parseInt(rental.carId) }));
            }
          }

          // Find user data - handle all ID types (ObjectId, number, string)
          if (rental.userId) {
            // Try multiple lookup strategies

            // 1. Try ObjectId lookup (for new rentals with ObjectId userId)
            if (mongoose.Types.ObjectId.isValid(rental.userId)) {
              try {
                userData = await User.findById(rental.userId).select(
                  "-passwordHash"
                );
                if (userData) {
                  console.log(`Found user by ObjectId: ${rental.userId}`);
                }
              } catch (error) {
                console.log(`ObjectId lookup failed for: ${rental.userId}`);
              }
            }

            // 2. Try custom id field lookup (for old rentals with numeric/string userId)
            if (!userData) {
              // Handle different userId formats
              let idToSearch;
              if (typeof rental.userId === "number") {
                idToSearch = rental.userId; // Already a number
              } else if (
                typeof rental.userId === "string" &&
                !isNaN(rental.userId)
              ) {
                idToSearch = parseInt(rental.userId); // String that represents a number
              } else {
                idToSearch = rental.userId; // String ID
              }

              // Try both exact match and parsed number
              userData = await User.findOne({ id: idToSearch }).select(
                "-passwordHash"
              );
              if (!userData && typeof idToSearch === "number") {
                userData = await User.findOne({
                  id: idToSearch.toString(),
                }).select("-passwordHash");
              }

              if (userData) {
                console.log(`Found user by custom id: ${idToSearch}`);
              }
            }
          }

          // Fallback to email lookup if ID lookup failed
          if (!userData && rental.userEmail) {
            userData = await User.findOne({ email: rental.userEmail }).select(
              "-passwordHash"
            );
            if (userData) {
              console.log(`Found user by email fallback: ${rental.userEmail}`);
            }
          }

          // Only include rentals where user data was successfully found
          if (userData) {
            rentalsWithData.push({
              ...rental.toObject(),
              car: carData,
              user: userData,
            });
          } else {
            console.log(
              `Skipping rental ${rental.id || rental._id} - user not found`
            );
          }
        } catch (rentalError) {
          console.error(
            `Error processing rental ${rental.id}:`,
            rentalError.message
          );
          // Skip rentals that cause errors entirely
          console.log(
            `Skipping rental ${rental.id || rental._id} due to error`
          );
        }
      }

      console.log(
        `Returning ${rentalsWithData.length} rentals with populated data (filtered)`
      );
      res.status(200).json(rentalsWithData);
    } else {
      // JSON fallback
      console.log("Using JSON fallback for rentals");
      const rentals = readJsonFile("rentItem.json");
      res.status(200).json(rentals);
    }
  } catch (error) {
    console.error("Get all rentals error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

const updateRental = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.body;

    if (process.env.USE_MONGODB === "true" && Rental && Car) {
      // Try to find rental by different ID types
      let rental = null;

      // 1. Try by MongoDB _id (for new rentals)
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        rental = await Rental.findById(req.params.id);
        if (rental) {
          console.log("Found rental by MongoDB _id for update");
        }
      }

      // 2. Try by id field as string (for old rentals)
      if (!rental) {
        rental = await Rental.findOne({ id: req.params.id });
        if (rental) {
          console.log("Found rental by id field (string) for update");
        }
      }

      // 3. Try by id field as number (for old rentals)
      if (!rental) {
        rental = await Rental.findOne({ id: parseInt(req.params.id) });
        if (rental) {
          console.log("Found rental by id field (number) for update");
        }
      }

      if (!rental) {
        console.log("Rental not found for update with ID:", req.params.id);
        return res.status(404).json({ error: "Rental not found" });
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        // Find car - handle both ObjectId and string carId
        let car = null;
        if (mongoose.Types.ObjectId.isValid(rental.carId)) {
          car = await Car.findById(rental.carId);
        } else {
          car = await Car.findOne({ id: rental.carId });
        }

        if (!car) {
          return res.status(404).json({ error: "Associated car not found" });
        }

        rental.startDate = startDate;
        rental.endDate = endDate;
        rental.totalDays = days;
        rental.totalPrice = days * car.price_per_day;
      }

      if (status) {
        rental.status = status;
      }

      await rental.save();
      await rental.populate("carId");

      res.status(200).json(rental);
    } else {
      // JSON fallback
      const rentals = readJsonFile("rentItem.json");
      const rentalIndex = rentals.findIndex((r) => r.id == req.params.id);

      if (rentalIndex === -1) {
        return res.status(404).json({ error: "Rental not found" });
      }

      const rental = rentals[rentalIndex];

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        rental.startDate = startDate;
        rental.endDate = endDate;
        rental.totalDays = days;
        rental.totalPrice = days * rental.pricePerDay;
      }

      if (status) {
        rental.status = status;
      }

      writeJsonFile("rentItem.json", rentals);
      res.status(200).json(rental);
    }
  } catch (error) {
    console.error("Update rental error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Public: get active bookings for a car (used by frontend availability calendar)
const getBookingsForCar = async (req, res) => {
  try {
    const { id } = req.params;

    if (process.env.USE_MONGODB === "true" && Rental) {
      // Build flexible query to match different carId formats
      const orClauses = [{ carId: id }];
      if (!isNaN(parseInt(id))) orClauses.push({ carId: parseInt(id) });
      if (mongoose.Types.ObjectId.isValid(id)) {
        orClauses.push({ carId: mongoose.Types.ObjectId(id) });
      }

      const rentals = await Rental.find({
        status: "active",
        $or: orClauses,
      }).select("startDate endDate id");

      const bookings = rentals.map((r) => ({
        startDate: r.startDate,
        endDate: r.endDate,
      }));
      return res.status(200).json({ bookings });
    }

    // JSON fallback
    const rentals = readJsonFile("rentItem.json");
    const filtered = rentals.filter(
      (r) => r.carId == id && r.status === "active"
    );
    const bookings = filtered.map((r) => ({
      startDate: r.startDate,
      endDate: r.endDate,
    }));
    res.status(200).json({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  checkCarAvailability,
  rentItem,
  getUserRentals,
  cancelRental,
  getAllRentals,
  updateRental,
  getBookingsForCar,
};
