const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ CORS setup using environment variable
const allowedOrigins = ["http://localhost:3000", "https://echowavedigital.com"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ✅ Routes
const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leave");
const userRoutes = require("./routes/userRoutes");

// ✅ Prefix all routes with /leave-system/api
app.use("/leave-system/api/auth", authRoutes);
app.use("/leave-system/api/leave", leaveRoutes);
app.use("/leave-system/api/users", userRoutes);

// ✅ 404 fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// ✅ Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
