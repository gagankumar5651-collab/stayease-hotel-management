
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const staffRoutes = require("./routes/staffRoutes");


// ==================================
// IMPORT ROUTES
// ==================================

const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// ==================================
// MIDDLEWARE
// ==================================

app.use(cors());
app.use(express.json());

// ==================================
// ROUTES
// ==================================

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
// ==================================
// HOME API
// ==================================

app.get("/", (req, res) => {
    res.send("Welcome to StayEase Hotel Management System!");
});

// ==================================
// PROTECTED API
// ==================================

app.get("/api/protected", authMiddleware, (req, res) => {
    res.status(200).json({
        message: "You accessed a protected route successfully!",
        user: req.user
    });
});

// ==================================
// 404 API
// ==================================

app.use((req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// ==================================
// MONGODB CONNECTION & SERVER START
// ==================================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env file");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`StayEase server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
