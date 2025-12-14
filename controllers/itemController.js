/* eslint-env node */
/* global require, module process __dirname*/

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Car =
  process.env.USE_MONGODB === "true" ? require("../models/Car") : null;

const { readJsonFile, writeJsonFile } = require("../utils/fileHelpers");

const addItem = async (req, res) => {
  try {
    const carData = req.body;

    if (process.env.USE_MONGODB === "true" && Car) {
      // Only check ID duplicates, allow multiple cars with same specs
      if (carData.id) {
        const existingCar = await Car.findOne({ id: carData.id });
        if (existingCar) {
          return res.status(409).json({
            error: `Car with ID "${carData.id}" already exists. Please use a different ID.`,
          });
        }
      }

      // Check if car with same make/model/year already exists
      const existingCar = await Car.findOne({
        make: carData.make,
        model: carData.model,
        year: carData.year,
      });
      if (existingCar) {
        return res.status(409).json({
          error: `Car "${carData.year} ${carData.make} ${carData.model}" already exists.`,
        });
      }

      const car = await Car.create(carData);
      res.status(201).json(car);
    } else {
      // JSON fallback
      const cars = readJsonFile("cars.json");

      // Check for duplicate id
      if (carData.id && cars.find((c) => c.id === carData.id)) {
        return res.status(409).json({
          error: `Car with ID "${carData.id}" already exists. Please use a different ID.`,
        });
      }

      const newCar = {
        id: carData.id || (cars.length ? cars[cars.length - 1].id + 1 : 1),
        ...carData,
      };
      cars.push(newCar);
      writeJsonFile("cars.json", cars);
      res.status(201).json(newCar);
    }
  } catch (error) {
    console.error("Add item error:", error);

    // Handle MongoDB duplicate key error gracefully
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json({
        error: `Car with ${field} "${value}" already exists. Please use a different value.`,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        error: `Validation Error: ${messages.join(", ")}`,
      });
    }

    res.status(500).json({ error: "Server error" });
  }
};

const listAllItems = async (req, res) => {
  try {
    if (process.env.USE_MONGODB === "true" && Car) {
      const cars = await Car.find();
      res.status(200).json(cars);
    } else {
      const cars = readJsonFile("cars.json");
      res.status(200).json(cars);
    }
  } catch (error) {
    console.error("List items error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getItemById = async (req, res) => {
  try {
    if (process.env.USE_MONGODB === "true" && Car) {
      // Find by the custom id field, not MongoDB _id
      const car = await Car.findOne({ id: req.params.id });
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.status(200).json(car);
    } else {
      const cars = readJsonFile("cars.json");
      const car = cars.find((c) => c.id == req.params.id);
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.status(200).json(car);
    }
  } catch (error) {
    console.error("Get item error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateItem = async (req, res) => {
  try {
    if (process.env.USE_MONGODB === "true" && Car) {
      // Find by custom id field
      const car = await Car.findOneAndUpdate({ id: req.params.id }, req.body, {
        new: true,
        runValidators: true,
      });
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.status(200).json(car);
    } else {
      const cars = readJsonFile("cars.json");
      const carIndex = cars.findIndex((c) => c.id == req.params.id);
      if (carIndex === -1) {
        return res.status(404).json({ error: "Car not found" });
      }
      cars[carIndex] = { ...cars[carIndex], ...req.body };
      writeJsonFile("cars.json", cars);
      res.status(200).json(cars[carIndex]);
    }
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteItem = async (req, res) => {
  try {
    if (process.env.USE_MONGODB === "true" && Car) {
      // Find by custom id field
      const car = await Car.findOneAndDelete({ id: req.params.id });
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.status(200).json({ message: "Car deleted successfully" });
    } else {
      const cars = readJsonFile("cars.json");
      const carIndex = cars.findIndex((c) => c.id == req.params.id);
      if (carIndex === -1) {
        return res.status(404).json({ error: "Car not found" });
      }
      cars.splice(carIndex, 1);
      writeJsonFile("cars.json", cars);
      res.status(200).json({ message: "Car deleted successfully" });
    }
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  addItem,
  listAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
