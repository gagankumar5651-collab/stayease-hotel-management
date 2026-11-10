
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Room = require("../models/Room");
const Booking = require("../models/booking");
const authMiddleware = require("../middleware/authMiddleware");

console.log("ROOM ROUTES LOADED");

// ======================================
// ADMIN ACCESS CHECK
// ======================================

const adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admin only."
        });
    }

    next();
};

// ======================================
// ROOM NUMBER VALIDATION
// ======================================

const isValidRoomNumber = (value) => {
    return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        Number.isInteger(Number(value)) &&
        Number(value) > 0
    );
};

// ======================================
// 1. ADD NEW ROOM
// POST /api/rooms/add
// ======================================

router.post("/add", authMiddleware, adminOnly, async (req, res) => {
    try {
        const {
            roomNumber,
            roomType,
            pricePerNight,
            capacity,
            description,
            status
        } = req.body;

        if (
            !isValidRoomNumber(roomNumber) ||
            !roomType ||
            pricePerNight == null ||
            capacity == null
        ) {
            return res.status(400).json({
                message: "Please provide all required room details"
            });
        }

        if (
            !Number.isFinite(Number(pricePerNight)) ||
            Number(pricePerNight) <= 0 ||
            !Number.isInteger(Number(capacity)) ||
            Number(capacity) < 1
        ) {
            return res.status(400).json({
                message: "Price must be positive and capacity must be a positive integer"
            });
        }

        const allowedTypes = ["Single", "Double", "Deluxe", "Suite"];
        const allowedStatuses = ["available", "booked", "maintenance"];

        if (!allowedTypes.includes(roomType)) {
            return res.status(400).json({
                message: "Invalid room type"
            });
        }

        if (status !== undefined && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid room status"
            });
        }

        const normalizedRoomNumber = Number(roomNumber);

        const existingRoom = await Room.findOne({
            roomNumber: normalizedRoomNumber
        });

        if (existingRoom) {
            return res.status(409).json({
                message: "Room number already exists"
            });
        }

        const newRoom = await Room.create({
            roomNumber: normalizedRoomNumber,
            roomType,
            pricePerNight: Number(pricePerNight),
            capacity: Number(capacity),
            description: typeof description === "string"
                ? description.trim()
                : "",
            ...(status !== undefined ? { status } : {})
        });

        return res.status(201).json({
            message: "Room added successfully!",
            room: newRoom
        });

    } catch (error) {
        console.error("Add Room Error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Room number already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid room details"
            });
        }

        return res.status(500).json({
            message: "Error adding room"
        });
    }
});

// ======================================
// 2. GET AVAILABLE ROOMS
// GET /api/rooms?checkIn=...&checkOut=...
// ======================================

router.get("/", async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;

        // Both dates must be provided together
        if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
            return res.status(400).json({
                message: "Please provide both check-in and check-out dates."
            });
        }

        // By default, show rooms whose status is available
        const query = {
            status: "available"
        };

        // Filter rooms according to selected dates
        if (checkIn && checkOut) {
            const startDate = new Date(checkIn);
            const endDate = new Date(checkOut);

            if (
                Number.isNaN(startDate.getTime()) ||
                Number.isNaN(endDate.getTime()) ||
                endDate <= startDate
            ) {
                return res.status(400).json({
                    message: "Invalid check-in or check-out dates."
                });
            }

            // Find rooms having overlapping confirmed bookings
            const bookedRooms = await Booking.distinct("room", {
                status: "confirmed",
                checkIn: { $lt: endDate },
                checkOut: { $gt: startDate }
            });

            // Exclude those rooms
            query._id = {
                $nin: bookedRooms
            };
        }

        const rooms = await Room.find(query).sort({
            createdAt: -1
        });

        return res.status(200).json({
            message: "Available rooms fetched successfully!",
            totalRooms: rooms.length,
            rooms
        });

    } catch (error) {
        console.error("Get Rooms Error:", error.message);

        return res.status(500).json({
            message: "Error fetching available rooms"
        });
    }
});

// ======================================
// 3. GET SINGLE ROOM
// GET /api/rooms/:id
// ======================================

router.get("/:id", async (req, res) => {
    try {
        const roomId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "Invalid room ID"
            });
        }

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        return res.status(200).json({
            message: "Room fetched successfully!",
            room
        });

    } catch (error) {
        console.error("Get Single Room Error:", error.message);

        return res.status(500).json({
            message: "Error fetching room"
        });
    }
});

// ======================================
// 4. UPDATE ROOM
// PUT /api/rooms/update/:id
// ======================================

router.put("/update/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const roomId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "Invalid room ID"
            });
        }

        const {
            roomNumber,
            roomType,
            pricePerNight,
            capacity,
            description,
            status
        } = req.body;

        const updateData = {};

        if (roomNumber !== undefined) {
            if (!isValidRoomNumber(roomNumber)) {
                return res.status(400).json({
                    message: "Room number must be a positive integer"
                });
            }

            updateData.roomNumber = Number(roomNumber);
        }

        if (roomType !== undefined) {
            const allowedTypes = ["Single", "Double", "Deluxe", "Suite"];

            if (!allowedTypes.includes(roomType)) {
                return res.status(400).json({
                    message: "Invalid room type"
                });
            }

            updateData.roomType = roomType;
        }

        if (pricePerNight !== undefined) {
            if (
                !Number.isFinite(Number(pricePerNight)) ||
                Number(pricePerNight) <= 0
            ) {
                return res.status(400).json({
                    message: "Price must be greater than zero"
                });
            }

            updateData.pricePerNight = Number(pricePerNight);
        }

        if (capacity !== undefined) {
            if (
                !Number.isInteger(Number(capacity)) ||
                Number(capacity) < 1
            ) {
                return res.status(400).json({
                    message: "Capacity must be a positive integer"
                });
            }

            updateData.capacity = Number(capacity);
        }

        if (description !== undefined) {
            if (typeof description !== "string") {
                return res.status(400).json({
                    message: "Invalid description"
                });
            }

            updateData.description = description.trim();
        }

        if (status !== undefined) {
            const allowedStatuses = [
                "available",
                "booked",
                "maintenance"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid room status"
                });
            }

            updateData.status = status;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "Please provide at least one field to update"
            });
        }

        if (updateData.roomNumber !== undefined) {
            const existingRoom = await Room.findOne({
                roomNumber: updateData.roomNumber,
                _id: { $ne: roomId }
            });

            if (existingRoom) {
                return res.status(409).json({
                    message: "Room number already exists"
                });
            }
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            roomId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedRoom) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        return res.status(200).json({
            message: "Room updated successfully!",
            room: updatedRoom
        });

    } catch (error) {
        console.error("Update Room Error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Room number already exists"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid room details"
            });
        }

        return res.status(500).json({
            message: "Error updating room"
        });
    }
});

// ======================================
// 5. DELETE ROOM
// DELETE /api/rooms/delete/:id
// ======================================

router.delete("/delete/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const roomId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                message: "Invalid room ID"
            });
        }

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const existingBooking = await Booking.findOne({
            room: roomId
        });

        if (existingBooking) {
            return res.status(409).json({
                message: "Room cannot be deleted because booking records exist. Set it to maintenance instead."
            });
        }

        await Room.findByIdAndDelete(roomId);

        return res.status(200).json({
            message: "Room deleted successfully!"
        });

    } catch (error) {
        console.error("Delete Room Error:", error.message);

        return res.status(500).json({
            message: "Error deleting room"
        });
    }
});

module.exports = router;
