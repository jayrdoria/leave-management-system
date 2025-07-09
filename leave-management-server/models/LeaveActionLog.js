const mongoose = require("mongoose");

const leaveActionLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "Manual Credit"
  performedBy: { type: String, required: true }, // admin name
  user: { type: String, required: true }, // employee name
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LeaveActionLog", leaveActionLogSchema);
