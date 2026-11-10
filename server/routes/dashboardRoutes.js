
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Room = require("../models/Room");
const Booking = require("../models/Booking");

const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// ADMIN DASHBOARD
// GET /api/dashboard
// ======================================

router.get("/", authMiddleware, async (req, res) => {
    try {
        // Admin authorization
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin only."
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Run independent database queries together
        const [
            totalUsers,
            totalStaff,
            totalRooms,
            availableRooms,
            bookedRooms,
            maintenanceRooms,
            totalBookings,
            confirmedBookings,
            cancelledBookings,
            todaysBookings,
            revenueResult,
            recentBookings
        ] = await Promise.all([

            User.countDocuments({ role: "customer" }),

            User.countDocuments({ role: "staff" }),

            Room.countDocuments(),

            Room.countDocuments({ status: "available" }),

            Room.countDocuments({ status: "booked" }),

            Room.countDocuments({ status: "maintenance" }),

            Booking.countDocuments(),

            Booking.countDocuments({ status: "confirmed" }),

            Booking.countDocuments({ status: "cancelled" }),

            Booking.countDocuments({
                createdAt: {
                    $gte: today,
                    $lt: tomorrow
                }
            }),

            Booking.aggregate([
                {
                    $match: {
                        status: "confirmed"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]),

            Booking.find()
                .populate("user", "name email")
                .populate("room", "roomNumber roomType")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean()
        ]);

        const totalRevenue = revenueResult.length > 0
            ? revenueResult[0].totalRevenue
            : 0;

        return res.status(200).json({
            message: "Dashboard data fetched successfully",

            dashboard: {
                totalUsers,
                totalStaff,

                totalRooms,
                availableRooms,
                bookedRooms,
                maintenanceRooms,

                totalBookings,
                confirmedBookings,
                cancelledBookings,

                todaysBookings,
                totalRevenue
            },

            recentBookings
        });

    } catch (error) {
        console.error("Dashboard Error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch dashboard data"
        });
    }
});

module.exports = router;
