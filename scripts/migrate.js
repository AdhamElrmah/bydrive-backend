const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Car = require("../models/Car");
const Rental = require("../models/Rental");
require("dotenv").config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Migrate users
    const usersPath = path.join(__dirname, "..", "users.json");
    if (fs.existsSync(usersPath)) {
      console.log("Migrating users...");
      const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
      for (const user of users) {
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash, // Already hashed
            role: user.role,
          });
        }
      }
      console.log("Users migrated successfully");
    }

    // Migrate cars
    const carsPath = path.join(__dirname, "..", "cars.json");
    if (fs.existsSync(carsPath)) {
      console.log("Migrating cars...");
      const cars = JSON.parse(fs.readFileSync(carsPath, "utf8"));
      for (const car of cars) {
        const existing = await Car.findOne({
          make: car.make,
          model: car.model,
          year: car.year,
        });
        if (!existing) {
          // Normalize transmission to lowercase
          const normalizedCar = {
            ...car,
            transmission: car.transmission
              ? car.transmission.toLowerCase()
              : car.transmission,
          };
          await Car.create(normalizedCar);
        }
      }
      console.log("Cars migrated successfully");
    }

    // Migrate rentals (this is the most complex)
    const rentalsPath = path.join(__dirname, "..", "rentItem.json");
    if (fs.existsSync(rentalsPath)) {
      console.log("Migrating rentals...");
      const rentals = JSON.parse(fs.readFileSync(rentalsPath, "utf8"));
      for (const rental of rentals) {
        // Find corresponding car and user by their old IDs or email
        let car, user;

        // Try to find by MongoDB _id first, then by old numeric id
        if (
          rental.carId &&
          typeof rental.carId === "string" &&
          rental.carId.length > 10
        ) {
          car = await Car.findById(rental.carId);
        } else {
          car = await Car.findOne({ id: rental.carId });
        }

        user = await User.findOne({ email: rental.userEmail });

        if (car && user) {
          const existingRental = await Rental.findOne({
            carId: car._id,
            userId: user._id,
            startDate: rental.startDate,
            endDate: rental.endDate,
          });

          if (!existingRental) {
            await Rental.create({
              carId: car._id,
              userId: user._id,
              userEmail: rental.userEmail,
              userName: rental.userName,
              startDate: rental.startDate,
              endDate: rental.endDate,
              pickupLocation: rental.pickupLocation,
              dropoffLocation: rental.dropoffLocation,
              specialRequests: rental.specialRequests,
              totalDays: rental.totalDays,
              pricePerDay: rental.pricePerDay,
              totalPrice: rental.totalPrice,
              status: rental.status,
              paymentInfo: rental.paymentInfo,
              createdAt: rental.createdAt,
            });
          }
        }
      }
      console.log("Rentals migrated successfully");
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  migrateData();
}
