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
      leaveCreditHistory,
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
      leaveCredits: 0, // deprecated
      leaveCreditHistory: Array.isArray(leaveCreditHistory)
        ? leaveCreditHistory.map((entry) => ({
            amount: entry.amount,
            expiresOn: new Date(entry.expiresOn),
            dateAdded: new Date(),
          }))
        : [],
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
      "country",
      "sex",
      "leaveCreditHistory", // ✅ support editing credits per year
    ];

    const updates = {};

    for (let key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // ✅ Normalize leaveCreditHistory if present
    if (
      updates.leaveCreditHistory &&
      Array.isArray(updates.leaveCreditHistory)
    ) {
      updates.leaveCreditHistory = updates.leaveCreditHistory.map((entry) => ({
        amount: entry.amount,
        expiresOn: new Date(entry.expiresOn),
        dateAdded: new Date(), // this marks the time of update
      }));
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

// ✅ MANUAL CREDIT (UPDATED FOR leaveCreditHistory)
router.post("/manual-credit", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const { userId, amount, description, expiresOn } = req.body;

    if (!userId || amount === undefined || !expiresOn) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const amountNum = Number(amount);
    const expiryDate = new Date(expiresOn);

    // Find if expiry already exists
    const existingEntry = user.leaveCreditHistory.find(
      (entry) =>
        new Date(entry.expiresOn).getFullYear() === expiryDate.getFullYear()
    );

    if (existingEntry) {
      existingEntry.amount += amountNum;
    } else {
      user.leaveCreditHistory.push({
        amount: amountNum,
        expiresOn: expiryDate,
        dateAdded: new Date(),
      });
    }

    await user.save();

    await LeaveActionLog.create({
      action: "Manual Credit",
      performedBy: req.user.name,
      user: user.name,
      userId: user._id,
      amount: amountNum,
      description: description || "",
      timestamp: new Date(),
    });

    res
      .status(200)
      .json({ msg: `Added ${amount} leave credit(s) to ${user.name}` });
  } catch (err) {
    console.error("Manual credit error:", err);
    res.status(500).json({ msg: "Failed to apply manual credit" });
  }
});

// ✅ ADD YEARLY CREDITS (PHASE 4)
let latestYearlyCreditTimestamp = null;

const getNextYearExpiry = () => {
  const now = new Date();
  const nextYear = now.getFullYear() + 1;
  return new Date(`${nextYear}-12-31T23:59:59.000+08:00`);
};

router.post("/yearly-credits", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const actionTimestamp = new Date();
    latestYearlyCreditTimestamp = actionTimestamp;

    const users = await User.find();

    for (const user of users) {
      let amount = null;

      if (user.country === "PH") {
        amount = 15;
      } else if (user.country === "Malta") {
        amount = 24;
      } else {
        // Skip Others or unsupported countries
        continue;
      }

      // Push into leaveCreditHistory
      user.leaveCreditHistory.push({
        amount,
        dateAdded: actionTimestamp,
        expiresOn: getNextYearExpiry(),
      });

      await user.save();

      // Log to leaveActionLogs
      await LeaveActionLog.create({
        action: "Yearly Credit",
        performedBy: req.user.name,
        user: user.name,
        userId: user._id,
        amount,
        description: `Yearly credit added (${amount}) for ${user.country}`,
        timestamp: actionTimestamp,
      });
    }

    res.status(200).json({
      msg: "Yearly leave credits granted to all users.",
      timestamp: actionTimestamp,
    });
  } catch (err) {
    console.error("Yearly Credit Error:", err);
    res.status(500).json({ msg: "Failed to apply yearly credits" });
  }
});

// ✅ RESET YEARLY CREDITS (Undo within 24h)
router.post("/reset-yearly-credits", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    const { timestamp } = req.body;
    if (!timestamp) {
      return res.status(400).json({ msg: "Timestamp is required" });
    }

    const parsedTimestamp = new Date(timestamp);

    const users = await User.find();

    for (const user of users) {
      // Filter out the matching yearly credit entry
      const originalLength = user.leaveCreditHistory.length;
      user.leaveCreditHistory = user.leaveCreditHistory.filter(
        (entry) =>
          new Date(entry.dateAdded).getTime() !== parsedTimestamp.getTime()
      );

      if (user.leaveCreditHistory.length !== originalLength) {
        await user.save();
      }
    }

    // Optionally delete the logs for this timestamp
    await LeaveActionLog.deleteMany({
      action: "Yearly Credit",
      timestamp: parsedTimestamp,
    });

    res.status(200).json({ msg: "Yearly credits reset successfully" });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ msg: "Reset failed" });
  }
});

// PUT /api/users/change-password
router.put("/change-password", authMiddleware, async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch)
    return res.status(401).json({ msg: "Current password is incorrect" });

  const newHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newHash;
  await user.save();

  res.json({ msg: "Password updated successfully" });
});

module.exports = router;
