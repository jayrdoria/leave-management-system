require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // Update path if needed

const createTestAdmin = async () => {
  const DB_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/your-db-name";

  try {
    await mongoose.connect(DB_URI);
    console.log("🟢 Connected to MongoDB");

    const email = "admin@test.com";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ Admin account already exists.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin123!", 10);

    const admin = new User({
      name: "Test Admin",
      email,
      passwordHash: hashedPassword, // ✅ correct field
      role: "admin",
      sex: "Male", // ✅ required field
      country: "PH",
      department: "HR",
      leaveCreditHistory: [
        {
          amount: 15,
          dateAdded: new Date(),
          expiresOn: new Date(new Date().getFullYear() + 1, 11, 31), // Dec 31 next year
        },
      ],
    });

    await admin.save();
    console.log("✅ Test admin account created successfully.");
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  } finally {
    await mongoose.disconnect();
  }
};

createTestAdmin();
