const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ✅ Load SSL Certificate & Key for employee.netovation.eu
const sslOptions = {
  key: fs.readFileSync(
    "/etc/letsencrypt/live/employee.netovation.eu/privkey.pem"
  ),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/employee.netovation.eu/fullchain.pem"
  ),
};

// ✅ CORS setup
const allowedOrigins = ["https://employee.netovation.eu"];

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

// ✅ API Routes
const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leave");
const userRoutes = require("./routes/userRoutes");

app.use("/leave-system/api/auth", authRoutes);
app.use("/leave-system/api/leave", leaveRoutes);
app.use("/leave-system/api/users", userRoutes);

// ✅ 404 fallback
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// ✅ Start HTTPS server
const PORT = process.env.PORT || 5050;
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(
    `✅ HTTPS server running on https://employee.netovation.eu:${PORT}`
  );
});
