const mongoose = require("mongoose");
const User = require("./models/User"); // adjust path if needed

// Your test user IDs
const userIds = ["682445a66e5dd514c64b75be", "681dc3a19619d76ece8fd001"];

// Credit entries for Test 5
const creditTemplate = [
  {
    amount: 5,
    dateAdded: new Date("2023-01-01"),
    expiresOn: new Date("2024-12-31T23:59:59.999Z"), // ❌ Expired
  },
  {
    amount: 1,
    dateAdded: new Date("2025-07-09"),
    expiresOn: new Date("2026-12-31T23:59:59.999Z"), // ✅ Valid
  },
];

async function updateUsers() {
  try {
    // 🔁 Replace with your actual MongoDB connection string
    await mongoose.connect("");

    for (const id of userIds) {
      await User.findByIdAndUpdate(id, {
        leaveCreditHistory: creditTemplate,
      });
      console.log(`✅ Updated leave credits for user ${id}`);
    }

    await mongoose.disconnect();
    console.log("✅ All done. Disconnected.");
  } catch (err) {
    console.error("❌ Error updating users:", err);
  }
}

updateUsers();
