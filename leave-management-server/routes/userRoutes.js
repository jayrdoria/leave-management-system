const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

// CREATE user
router.post("/", async (req, res) => {
  try {
    const { name, email, role, department, leaveCredits } = req.body;
    const newUser = new User({ name, email, role, department, leaveCredits });
    await newUser.save();
    res.status(201).json({ msg: "User created successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to create user" });
  }
});

// UPDATE user
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update user" });
  }
});

module.exports = router;
