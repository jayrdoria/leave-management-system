const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Leave = require("../models/Leave");

// ✅ GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash -__v");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

// ✅ GET user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { passwordHash, __v, ...safeData } = user.toObject();
    res.status(200).json(safeData);
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    res.status(500).json({ msg: "Error fetching user" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      passwordHash, // sent as plain password from frontend
      role,
      department,
      departmentScope,
      leaveCredits,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already exists" });

    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    const newUser = new User({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      department,
      departmentScope,
      leaveCredits,
    });

    await newUser.save();
    res.status(201).json({ msg: "User created successfully", user: newUser });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ msg: "Failed to create user" });
  }
});

// ✅ UPDATE user
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow safe updates
    const allowedFields = [
      "name",
      "email",
      "role",
      "department",
      "departmentScope",
      "leaveCredits",
    ];
    const updates = {};

    for (let key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (req.body.passwordHash) {
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(req.body.passwordHash, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updatedUser) return res.status(404).json({ msg: "User not found" });

    res.status(200).json({ msg: "User updated", user: updatedUser });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ msg: "Failed to update user" });
  }
});

// ✅ DELETE user
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ msg: "User not found" });

    // ✅ Delete all leaves belonging to the deleted user
    await Leave.deleteMany({ userId });

    res
      .status(200)
      .json({ msg: "User and related leaves deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ msg: "Failed to delete user" });
  }
});

module.exports = router;
