const mongoose = require("mongoose");

const leaveCreditEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    dateAdded: { type: Date, required: true },
    expiresOn: { type: Date, required: true },
  },
  { _id: false } // don't auto-create _id for subdocuments
);

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

    // ✅ REPLACEMENT STRUCTURE
    leaveCreditHistory: {
      type: [leaveCreditEntrySchema],
      default: [],
    },

    // 🔥 REMOVE this after migration
    // leaveCredits: {
    //   type: Number,
    //   default: 15,
    // },

    country: {
      type: String,
      enum: ["PH", "Malta", "Others"],
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
