const express = require("express");
const router = express.Router();
const Leave = require("../models/Leave");

// Apply for leave
router.post("/apply", async (req, res) => {
  const { userId, type, category, deductCredits, startDate, endDate, reason } =
    req.body;

  try {
    const leave = new Leave({
      userId,
      type,
      category,
      deductCredits,
      startDate,
      endDate,
      reason,
    });

    await leave.save();
    res.status(201).json({ msg: "Leave request submitted", leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to submit leave request" });
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

// Cancel a leave request by ID (only if status is pending)
router.delete("/:leaveId", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.leaveId);
    if (!leave) return res.status(404).json({ msg: "Leave not found" });

    if (leave.status !== "Pending") {
      return res
        .status(400)
        .json({ msg: "Only pending leaves can be cancelled" });
    }

    await Leave.findByIdAndDelete(req.params.leaveId);
    res.json({ msg: "Leave cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to cancel leave" });
  }
});

module.exports = router;
