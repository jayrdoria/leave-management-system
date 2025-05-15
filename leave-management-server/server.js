const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Allow requests from your frontend origin
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend
    credentials: true,
  })
);

app.use(express.json());

// ✅ Mongo connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ✅ Routes
const authRoutes = require("./routes/auth");
const leaveRoutes = require("./routes/leave");

app.use("/api/auth", authRoutes);
app.use("/api/leave", leaveRoutes);

// ✅ 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
