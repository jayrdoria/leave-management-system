const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },
    department: { type: String },
    departmentScope: {
      type: [String],
      default: [],
    },
    leaveCredits: {
      type: Number,
      default: 15, // default for all new users
    },
    country: {
      type: String,
      enum: ["PH", "Malta"],
      required: true,
      default: "PH",
    },
    sex: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
