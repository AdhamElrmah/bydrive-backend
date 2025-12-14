/* eslint-env node */
/* global require, exports, __dirname ,process*/

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const User =
  process.env.USE_MONGODB === "true" ? require("../models/User") : null;

const { readJsonFile, writeJsonFile } = require("../utils/fileHelpers");

exports.getAllUsers = async (req, res) => {
  try {
    if (process.env.USE_MONGODB === "true" && User) {
      const users = await User.find().select("-passwordHash");

      // Ensure all users have an id field
      const usersWithIds = users.map((user) => ({
        id: user.id || user._id.toString(), // Use existing id or convert _id to string
        name: user.name,
        email: user.email,
        role: user.role,
      }));

      res.status(200).json(usersWithIds);
    } else {
      const users = readJsonFile("users.json").map((user) => {
        const { passwordHash, ...publicUser } = user;
        return publicUser;
      });
      res.status(200).json(users);
    }
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (
      !userId ||
      userId === "undefined" ||
      userId === "null" ||
      userId === ""
    ) {
      return res.status(400).json({
        error: "Invalid user ID",
        received: userId,
        message:
          "Frontend is sending undefined userId. Check your routing and state management.",
        suggestion:
          "Make sure the user ID is properly stored after user creation.",
      });
    }

    if (process.env.USE_MONGODB === "true" && User) {
      console.log("Looking for user with ID:", userId);

      let user = null;

      // Try by id field (number) first
      if (!isNaN(userId)) {
        user = await User.findOne({ id: parseInt(userId) }).select(
          "-passwordHash"
        );
        if (user) {
          console.log("Found user by id field (number)");
        }
      }

      // Try by MongoDB _id (for ObjectIds)
      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).select("-passwordHash");
        if (user) {
          console.log("Found user by MongoDB _id");
        }
      }

      if (!user) {
        console.log("User not found with ID:", userId);
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      // JSON fallback
      const users = readJsonFile("users.json");
      const user = users.find((u) => u.id == userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { passwordHash, ...publicUser } = user;
      res.status(200).json(publicUser);
    }
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (process.env.USE_MONGODB === "true" && User) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Find the highest existing id and increment it
      const lastUser = await User.findOne().sort({ id: -1 }).select("id");
      const nextId =
        lastUser && typeof lastUser.id === "number" ? lastUser.id + 1 : 1;

      console.log("Creating user with ID:", nextId);

      const user = await User.create({
        id: nextId, // Auto-increment ID
        name,
        email,
        passwordHash: password,
        role: role || "user",
      });

      const publicUser = {
        id: user.id, // Return the numeric ID for frontend
        name: user.name,
        email: user.email,
        role: user.role,
      };
      res.status(201).json(publicUser);
    } else {
      // JSON fallback
      const users = readJsonFile("users.json");
      const exists = users.find((u) => u.email === email);
      if (exists) {
        return res.status(409).json({ error: "User already exists" });
      }

      const passwordHash = require("bcryptjs").hashSync(password, 10);
      const id = users.length ? users[users.length - 1].id + 1 : 1;
      const newUser = {
        id,
        name,
        email,
        passwordHash,
        role: role || "user",
      };
      users.push(newUser);
      writeJsonFile("users.json", users);

      const { passwordHash: _passwordHash, ...publicUser } = newUser;
      res.status(201).json(publicUser);
    }
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (process.env.USE_MONGODB === "true" && User) {
      console.log("Updating user with ID:", userId);

      // Handle password update
      if (updates.password) {
        // For MongoDB with Mongoose, the pre-save hook handles hashing
        // So we just pass the plain password to passwordHash field
        updates.passwordHash = updates.password;
        delete updates.password;
      }

      // Handle name update
      if (updates.firstName || updates.lastName) {
        // We need to fetch the user first to get the other part of the name if only one is updated
        // But for simplicity, we can assume the frontend sends both or we just update what we have
        // Actually, let's just update the name if both are present in updates, or we will rely on the user object fetch below
      }

      let user = null;

      // Try by id field (number) first
      if (!isNaN(userId)) {
        user = await User.findOne({ id: parseInt(userId) }); // Removed .select("-passwordHash") to allow saving
        if (user) {
          console.log("Found user by id field for update");

          // Update name if firstName or lastName is provided
          if (updates.firstName || updates.lastName) {
            const firstName = updates.firstName || user.firstName;
            const lastName = updates.lastName || user.lastName;
            updates.name = `${firstName} ${lastName}`;
          }

          Object.assign(user, updates);
          await user.save();
          
          return res.status(200).json({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
          });
        }
      }

      // Try by MongoDB _id
      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        // For findByIdAndUpdate, we need to construct the updates object carefully
        if (updates.firstName || updates.lastName) {
           // This is tricky with findByIdAndUpdate because we don't have the old doc easily without another query
           // Let's fetch first then update, similar to above
           user = await User.findById(userId);
           if (user) {
             if (updates.passwordHash) user.passwordHash = updates.passwordHash;
             
             if (updates.firstName || updates.lastName) {
                const firstName = updates.firstName || user.firstName;
                const lastName = updates.lastName || user.lastName;
                user.name = `${firstName} ${lastName}`;
             }
             
             Object.assign(user, updates);
             await user.save();

             return res.status(200).json({
                id: user.id || user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
              });
           }
        } else {
            // Fallback to direct update if no complex logic needed (but we want consistency)
             user = await User.findByIdAndUpdate(userId, updates, {
              new: true,
              runValidators: true,
            }).select("-passwordHash");
        }

        if (user) {
          console.log("Updated user by MongoDB _id");
          return res.status(200).json({
            id: user.id || user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
          });
        }
      }

      console.log("User not found for update:", userId);
      return res.status(404).json({ error: "User not found" });
    } else {
      // JSON fallback
      const users = readJsonFile("users.json");
      const userIndex = users.findIndex((u) => u.id == userId);
      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }

      if (updates.password) {
        const bcrypt = require("bcryptjs");
        updates.passwordHash = bcrypt.hashSync(updates.password, 10);
        delete updates.password;
      }

      const currentUser = users[userIndex];
      if (updates.firstName || updates.lastName) {
        const firstName = updates.firstName || currentUser.firstName;
        const lastName = updates.lastName || currentUser.lastName;
        updates.name = `${firstName} ${lastName}`;
      }

      users[userIndex] = { ...currentUser, ...updates };
      writeJsonFile("users.json", users);
      const { passwordHash, ...publicUser } = users[userIndex];
      res.status(200).json(publicUser);
    }
  } catch (error) {
    console.error("Update user error:", error);

    // Handle MongoDB duplicate key error for username or email
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json({
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" already exists. Please use a different ${field}.`,
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

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === "undefined" || userId === "null") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (process.env.USE_MONGODB === "true" && User) {
      console.log("Deleting user with ID:", userId);

      let user = null;

      // Try by id field (number) first
      if (!isNaN(userId)) {
        user = await User.findOneAndDelete({ id: parseInt(userId) });
        if (user) {
          console.log("Deleted user by id field");
          return res.status(200).json({ message: "User deleted successfully" });
        }
      }

      // Try by MongoDB _id
      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findByIdAndDelete(userId);
        if (user) {
          console.log("Deleted user by MongoDB _id");
          return res.status(200).json({ message: "User deleted successfully" });
        }
      }

      console.log("User not found for deletion:", userId);
      return res.status(404).json({ error: "User not found" });
    } else {
      // JSON fallback
      const users = readJsonFile("users.json");
      const userIndex = users.findIndex((u) => u.id == userId);
      if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
      }
      users.splice(userIndex, 1);
      writeJsonFile("users.json", users);
      res.status(200).json({ message: "User deleted successfully" });
    }
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
