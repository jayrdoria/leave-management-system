const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Leave with Pay",
        "Leave without Pay",
        "Reduction of Overtime / Offset",
        "Birthday Leave",
        "Paternity Leave",
        "Maternity Leave",
        "Sickness Leave",
      ],
      required: true,
    },
    duration: {
      type: String,
      enum: ["Full Day", "Half Day"],
      default: "Full Day",
    },
    deductCredits: { type: Boolean, default: false },

    // ✅ NEW FIELD for Phase 3
    deductedFrom: {
      type: [
        {
          expiryDate: { type: Date, required: true },
          amount: { type: Number, required: true },
        },
      ],
      _id: false,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    comment: { type: String },
    department: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
