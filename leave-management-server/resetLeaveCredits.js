// scripts/resetLeaveCredits.js
const mongoose = require("mongoose");
const User = require("./models/User");

const resetLeaveCredits = async () => {
  await mongoose.connect(
    "mongodb+srv://admin:Smtp123!@leave-cluster.0gjlml7.mongodb.net/leave-management"
  );

  const users = await User.find({});

  const updates = users.map(async (user) => {
    const expiry = new Date("2026-12-31T23:59:59.999Z");
    user.leaveCreditHistory = [
      {
        amount: 15,
        dateAdded: new Date(),
        expiresOn: expiry,
      },
    ];
    await user.save();
    console.log(`Reset leave credits for ${user.name}`);
  });

  await Promise.all(updates);
  console.log("✅ All leave credits reset.");
  process.exit();
};

resetLeaveCredits();
