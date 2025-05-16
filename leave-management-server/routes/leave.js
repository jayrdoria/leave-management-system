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
      category,
      duration,
      startDate,
      endDate,
      reason,
      deductCredits,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const newLeave = new Leave({
      userId,
      category,
      duration,
      startDate,
      endDate,
      reason,
      deductCredits,
      department: user.department,
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

// ✅ GET /api/leave/scoped — View all leaves in employee's department scope
router.get("/scoped", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    const departments = user.departmentScope?.length
      ? [...new Set([user.department, ...user.departmentScope])]
      : [user.department];

    const leaves = await Leave.find({
      department: { $in: departments },
      status: { $ne: "Rejected" },
    }).populate("userId", "name department");

    res.status(200).json(leaves);
  } catch (err) {
    console.error("Scoped view error:", err);
    res.status(500).json({ msg: "Failed to load department leaves" });
  }
});

router.get("/one/:leaveId", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.leaveId).populate(
      "userId",
      "name email _id"
    ); // ✅ populate
    if (!leave) return res.status(404).json({ msg: "Leave not found" });
    res.json({
      ...leave.toObject(),
      user: leave.userId, // ✅ attach populated userId as `user`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch leave" });
  }
});

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
    }).populate("userId", "name email leaveCredits");

    res.status(200).json(leaves);
  } catch (err) {
    console.error("Manager GET leaves error:", err);
    res.status(500).json({ msg: "Error fetching leave requests" });
  }
});

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

    const user = await User.findById(leave.userId);
    if (!user) {
      return res.status(404).json({ msg: "Leave owner not found." });
    }

    // ✅ Cancel Approval
    if (status === "Pending") {
      if (leave.status === "Approved" && leave.deductCredits) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const timeDiff = end.getTime() - start.getTime();
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        const refund = leave.duration === "Half Day" ? 0.5 : days;
        user.leaveCredits += refund;
        await user.save();
      }

      leave.status = "Pending";
      leave.comment = "";
      leave.approverId = undefined;
    }

    // ✅ Approve or Reject
    else if (["Approved", "Rejected"].includes(status)) {
      leave.status = status;
      leave.comment = comment || "";
      leave.approverId = req.user.id;

      // ✅ Deduct leave credits only if approved and marked to deduct
      if (status === "Approved" && leave.deductCredits) {
        let deduction = 1;

        if (leave.duration === "Half Day") {
          deduction = 0.5;
        } else {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const timeDiff = end.getTime() - start.getTime();
          deduction = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        }

        if (user.leaveCredits < deduction) {
          return res.status(400).json({ msg: "Insufficient leave credits." });
        }

        user.leaveCredits -= deduction;
        await user.save();
      }
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

    // ✅ Correct logic:
    const canDelete =
      (isOwner && isPending) || // Owner (employee/manager) cancels their pending leave
      (isManagerOrAdmin && isApprovedOrRejected); // Manager/Admin deletes any approved/rejected leave

    if (!canDelete) {
      return res
        .status(403)
        .json({ msg: "You are not allowed to delete this leave." });
    }

    // ✅ Refund credits if approved + deductCredits is true
    if (leave.status === "Approved" && leave.deductCredits) {
      const user = await User.findById(leave.userId);
      if (user) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const timeDiff = end.getTime() - start.getTime();
        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        const refund = leave.duration === "Half Day" ? 0.5 : days;
        user.leaveCredits += refund;
        await user.save();
      }
    }

    await Leave.findByIdAndDelete(leaveId);

    res.status(200).json({ msg: "Leave deleted successfully" });
  } catch (err) {
    console.error("Delete leave error:", err);
    res.status(500).json({ msg: "Failed to delete leave" });
  }
});

module.exports = router;
