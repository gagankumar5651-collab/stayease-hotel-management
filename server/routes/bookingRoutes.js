
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Booking = require("../models/booking");

const Room = require("../models/Room");
const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// 1. CREATE BOOKING
// POST /api/bookings/create
// CUSTOMER ONLY
// ======================================

router.post("/create", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Only customers can create bookings."
            });
        }

        const { roomId, checkIn, checkOut, guests } = req.body;
        const userId = req.user.userId;

        if (!roomId || !checkIn || !checkOut || guests === undefined) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "Invalid room ID."
            });
        }

        // Validate dates
        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (
            isNaN(startDate.getTime()) ||
            isNaN(endDate.getTime()) ||
            endDate <= startDate
        ) {
            return res.status(400).json({
                message: "Invalid check-in or check-out dates."
            });
        }

        // Reject past check-in dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookingDate = new Date(startDate);
        bookingDate.setHours(0, 0, 0, 0);

        if (bookingDate < today) {
            return res.status(400).json({
                message: "Check-in date cannot be in the past."
            });
        }

        // Validate guests
        if (!Number.isInteger(guests) || guests < 1) {
            return res.status(400).json({
                message: "Guests must be a positive whole number."
            });
        }

        // Find room
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                message: "Room not found."
            });
        }

        if (room.status === "maintenance") {
            return res.status(400).json({
                message: "Room is under maintenance."
            });
        }

        if (guests > room.capacity) {
            return res.status(400).json({
                message: "Guest count exceeds room capacity."
            });
        }

        // Check overlapping confirmed bookings
        const existingBooking = await Booking.findOne({
            room: roomId,
            status: "confirmed",
            checkIn: { $lt: endDate },
            checkOut: { $gt: startDate }
        });

        if (existingBooking) {
            return res.status(409).json({
                message: "Room is already booked for these dates."
            });
        }

        // Validate room price
        if (
            typeof room.pricePerNight !== "number" ||
            room.pricePerNight <= 0
        ) {
            return res.status(400).json({
                message: "Room price is not configured correctly."
            });
        }

        // Calculate total amount
        const millisecondsPerDay = 1000 * 60 * 60 * 24;

        const nights = Math.ceil(
            (endDate - startDate) / millisecondsPerDay
        );

        const totalAmount = nights * room.pricePerNight;

        // Create booking
        const booking = await Booking.create({
            user: userId,
            room: roomId,
            checkIn: startDate,
            checkOut: endDate,
            guests,
            totalAmount,
            status: "confirmed"
        });

        return res.status(201).json({
            message: "Booking created successfully!",
            booking
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to create booking.",
            error: error.message
        });
    }
});

// ======================================
// 2. GET ALL BOOKINGS
// GET /api/bookings/all
// ADMIN / STAFF ONLY
// ======================================

router.get("/all", authMiddleware, async (req, res) => {
    try {
        if (!["admin", "staff"].includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. Admin or staff only."
            });
        }

        const bookings = await Booking.find()
            .populate("user", "name email phone")
            .populate("room", "roomNumber roomType pricePerNight")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "All bookings fetched successfully!",
            count: bookings.length,
            bookings
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch bookings.",
            error: error.message
        });
    }
});

// ======================================
// 3. GET MY BOOKINGS
// GET /api/bookings/my-bookings
// CUSTOMER ONLY
// ======================================

router.get("/my-bookings", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Only customers can access their bookings."
            });
        }

        const bookings = await Booking.find({
            user: req.user.userId
        })
            .populate("room", "roomNumber roomType pricePerNight")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Your bookings fetched successfully!",
            count: bookings.length,
            bookings
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch your bookings.",
            error: error.message
        });
    }
});

// ======================================
// 4. CANCEL BOOKING
// PATCH /api/bookings/cancel/:id
// OWNER / ADMIN / STAFF
// ======================================

router.patch("/cancel/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        // Only owner, admin or staff can cancel
        if (
            booking.user.toString() !== userId &&
            !["admin", "staff"].includes(role)
        ) {
            return res.status(403).json({
                message: "You are not allowed to cancel this booking."
            });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Booking is already cancelled."
            });
        }

        booking.status = "cancelled";
        await booking.save();

        return res.status(200).json({
            message: "Booking cancelled successfully!",
            booking
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to cancel booking.",
            error: error.message
        });
    }
});

module.exports = router;
