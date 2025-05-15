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
      ],
      required: true,
    },
    deductCredits: { type: Boolean, default: false },
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

    // ✅ Added this for manager filtering
    department: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
