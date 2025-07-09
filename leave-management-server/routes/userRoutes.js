const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Leave = require("../models/Leave");
const LeaveActionLog = require("../models/LeaveActionLog");
const authMiddleware = require("../middleware/auth");

// ✅ GET LEAVE ACTION LOGS
router.get("/leave-action-logs", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const logs = await LeaveActionLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    console.error("Fetch logs error:", err);
    res.status(500).json({ msg: "Error fetching logs" });
  }
});

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

// ✅ CREATE user
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      passwordHash,
      role,
      department,
      departmentScope,
      leaveCredits,
      country,
      sex,
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
      country,
      sex,
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
    const allowedFields = [
      "name",
      "email",
      "role",
      "department",
      "departmentScope",
      "leaveCredits",
      "country",
      "sex",
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

    await Leave.deleteMany({ userId });
    res
      .status(200)
      .json({ msg: "User and related leaves deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ msg: "Failed to delete user" });
  }
});

// ✅ MANUAL CREDIT (NEW)
router.post("/manual-credit", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const { userId, amount, description } = req.body;

    if (!userId || amount === undefined) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.leaveCredits += Number(amount);
    await user.save();

    await LeaveActionLog.create({
      action: "Manual Credit",
      performedBy: req.user.name,
      user: user.name,
      userId: user._id,
      amount: Number(amount),
      description: description || "",
      timestamp: new Date(),
    });

    res
      .status(200)
      .json({ msg: `Added ${amount} leave credits to ${user.name}` });
  } catch (err) {
    console.error("Manual credit error:", err);
    res.status(500).json({ msg: "Failed to apply manual credit" });
  }
});

// ✅ RESET LEAVES
router.post("/reset-leaves", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await User.updateMany({}, { $set: { leaveCredits: 0 } });

    await LeaveActionLog.create({
      action: "Reset Leaves",
      performedBy: req.user.name,
    });

    res.json({ msg: "All leave credits reset to 0" });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ msg: "Error resetting leave credits" });
  }
});

// ✅ ADD STANDARD LEAVES
router.post("/add-standard-leaves", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const users = await User.find();

    const bulkOps = users.map((user) => {
      const standard =
        user.country === "PH" ? 15 : user.country === "Malta" ? 24 : 0;
      return {
        updateOne: {
          filter: { _id: user._id },
          update: { $inc: { leaveCredits: standard } },
        },
      };
    });

    await User.bulkWrite(bulkOps);

    await LeaveActionLog.create({
      action: "Add Standard Leaves",
      performedBy: req.user.name,
    });

    res.json({ msg: "Standard leave credits added based on country" });
  } catch (err) {
    console.error("Add standard leave error:", err);
    res.status(500).json({ msg: "Error adding standard leave credits" });
  }
});

// POST /api/users/add-parent-leave
router.post("/add-parent-leave", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const admin = req.user;

    if (admin.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const creditsToAdd =
      user.sex === "Male" ? 10 : user.sex === "Female" ? 45 : 0;

    if (creditsToAdd === 0) {
      return res
        .status(400)
        .json({ msg: "User sex not defined for parent leave." });
    }

    user.leaveCredits += creditsToAdd;
    await user.save();

    await LeaveActionLog.create({
      action: `Added ${creditsToAdd} ${
        user.sex === "Male" ? "Paternity" : "Maternity"
      } Leave credits to ${user.name}`,
      performedBy: admin.name,
      timestamp: new Date(),
    });

    res.status(200).json({ msg: "Parent leave credits added." });
  } catch (err) {
    console.error("Parent leave add error:", err);
    res.status(500).json({ msg: "Server error while adding parent leave." });
  }
});

module.exports = router;
