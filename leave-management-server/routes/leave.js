const express = require("express");
const router = express.Router();
const Leave = require("../models/Leave");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Apply for leave
router.post("/apply", async (req, res) => {
  try {
    const {
      userId,
      type,
      category,
      duration,
      startDate,
      endDate,
      reason,
      deductCredits,
    } = req.body;

    const user = await User.findById(userId); // Make sure to import User model

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const newLeave = new Leave({
      userId,
      type,
      category,
      duration,
      startDate,
      endDate,
      reason,
      deductCredits,
      department: user.department, // ✅ Add department directly here
    });

    await newLeave.save();
    res.status(201).json({ msg: "Leave applied successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error applying for leave" });
  }
});

router.get("/mine/:userId", async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(leaves);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch leave history" });
  }
});

// Get a single leave by ID
router.get("/one/:leaveId", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.leaveId);
    if (!leave) return res.status(404).json({ msg: "Leave not found" });
    res.json(leave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch leave" });
  }
});

// ✅ Manager View: Get all leaves in their department
router.get("/manager/leaves", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({ msg: "Access denied. Not a manager." });
    }

    const departments =
      Array.isArray(req.user.departmentScope) &&
      req.user.departmentScope.length > 0
        ? req.user.departmentScope
        : [req.user.department];

    const leaves = await Leave.find({
      department: { $in: departments },
    }).populate("userId", "name email");

    res.status(200).json(leaves);
  } catch (err) {
    console.error("Manager GET leaves error:", err);
    res.status(500).json({ msg: "Error fetching leave requests" });
  }
});

// ✅ Manager Action: Approve or Reject Leave
router.put("/manager/leave/:id", authMiddleware, async (req, res) => {
  try {
    const { status, comment } = req.body;
    const leaveId = req.params.id;

    if (req.user.role !== "manager") {
      return res.status(403).json({ msg: "Access denied. Not a manager." });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ msg: "Leave not found." });
    }

    if (leave.department !== req.user.department) {
      return res
        .status(403)
        .json({ msg: "Not authorized for this department." });
    }

    // ✅ Support Cancel Approval
    if (status === "Pending") {
      leave.status = "Pending";
      leave.comment = "";
      leave.approverId = undefined;
    } else if (["Approved", "Rejected"].includes(status)) {
      leave.status = status;
      leave.comment = comment || "";
      leave.approverId = req.user.id;
    } else {
      return res.status(400).json({ msg: "Invalid status." });
    }

    await leave.save();
    res.status(200).json({ msg: `Leave updated to ${leave.status}.` });
  } catch (err) {
    console.error("Manager update error:", err);
    res.status(500).json({ msg: "Error updating leave status." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const leaveId = req.params.id;
  const userId = req.user.id;

  try {
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ msg: "Leave not found" });
    }

    const isOwner = leave.userId.toString() === userId;
    const isManagerOrAdmin = ["manager", "admin"].includes(req.user.role);

    const isPending = leave.status === "Pending";
    const isApprovedOrRejected = ["Approved", "Rejected"].includes(
      leave.status
    );

    const canDelete =
      (isOwner && isPending) || // employee cancels pending leave
      (isManagerOrAdmin && isApprovedOrRejected); // manager/admin deletes approved/rejected

    if (!canDelete) {
      return res
        .status(403)
        .json({ msg: "You are not allowed to delete this leave." });
    }

    await Leave.findByIdAndDelete(leaveId);
    res.status(200).json({ msg: "Leave deleted successfully" });
  } catch (err) {
    console.error("Delete leave error:", err);
    res.status(500).json({ msg: "Failed to delete leave" });
  }
});

module.exports = router;
