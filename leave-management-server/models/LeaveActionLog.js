// models/LeaveActionLog.js
const mongoose = require("mongoose");

const leaveActionLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., "Reset", "Add"
  performedBy: { type: String, required: true }, // name or ID of admin
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LeaveActionLog", leaveActionLogSchema);
