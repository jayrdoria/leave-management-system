const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Make sure this line exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // ✅ Only run this AFTER defining `user`
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
        department: user.department,
        departmentScope: user.departmentScope || [], // ✅ Add this
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // ✅ Safely remove sensitive fields
    const { passwordHash, __v, ...userData } = user.toObject();

    res.json({
      token,
      user: userData, // this includes leaveCredits
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});
// Create test user (TEMP)
router.post("/create-test-user", async (req, res) => {
  const { name, email, password, role, department } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role,
      department,
    });

    await newUser.save();
    res.status(201).json({ msg: "Test user created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error creating user" });
  }
});

router.get("/validate", authMiddleware, (req, res) => {
  return res.status(200).json({ msg: "Token valid", user: req.user });
});

module.exports = router;
