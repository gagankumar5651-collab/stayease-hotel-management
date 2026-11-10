const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Request = require("../models/Request");
const Booking = require("../models/booking");
const User = require("../models/User");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

// ROLE CHECK
const isStaffOrAdmin = (req) => {
    return ["staff", "admin"].includes(req.user.role);
};

// 1. CREATE CUSTOMER REQUEST
// POST /api/requests

router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Only customers can create requests."
            });
        }

        const { roomNumber, requestType, description } = req.body;
        console.log("REQUEST BODY:", req.body);
        console.log("ROOM NUMBER TYPE:", typeof roomNumber);

        const numericRoomNumber = Number(roomNumber);

        if (
            roomNumber === undefined ||
            roomNumber === null ||
            roomNumber === "" ||
            !Number.isInteger(numericRoomNumber) ||
            numericRoomNumber < 1 ||
            typeof requestType !== "string" ||
            !requestType.trim()
        ) {
            return res.status(400).json({
                message: "Valid room number and request type are required."
            });
        }

        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be a string."
            });
        }

        // Verify active booking
        const now = new Date();

        const activeBookings = await Booking.find({
            user: req.user.userId,
            status: "confirmed",
            checkIn: { $lte: now },
            checkOut: { $gt: now }
        }).populate("room", "roomNumber");

        const hasActiveBooking = activeBookings.some(
            (booking) =>
                booking.room &&
                Number(booking.room.roomNumber) === numericRoomNumber
        );

        if (!hasActiveBooking) {
            return res.status(403).json({
                message: "You must have an active booking for this room."
            });
        }

        // Create request
        const newRequest = await Request.create({
            customerId: req.user.userId,
            roomNumber: numericRoomNumber,
            requestType: requestType.trim(),
            description: description ? description.trim() : "",
            status: "Pending"
        });

        // Notify all staff and admins
        try {
            const staffMembers = await User.find({
                role: { $in: ["staff", "admin"] }
            }).select("_id");

            if (staffMembers.length > 0) {
                await Notification.insertMany(
                    staffMembers.map((staff) => ({
                        recipient: staff._id,
                        requestId: newRequest._id,
                        title: "New Customer Request",
                        message: `A customer requested ${requestType.trim()} for room ${numericRoomNumber}.`,
                        type: "request_created"
                    }))
                );
            }
        } catch (notificationError) {
            console.error(
                "Staff notification error:",
                notificationError.message
            );
        }

        return res.status(201).json({
            message: "Request created successfully!",
            request: newRequest
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to create request.",
            error: error.message
        });
    }
});

// 2. GET ALL REQUESTS
// STAFF / ADMIN ONLY

router.get("/", authMiddleware, async (req, res) => {
    try {
        if (!isStaffOrAdmin(req)) {
            return res.status(403).json({
                message: "Access denied. Staff or admin only."
            });
        }

        const requests = await Request.find()
            .populate("customerId", "name email phone")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Requests fetched successfully!",
            totalRequests: requests.length,
            requests
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch requests.",
            error: error.message
        });
    }
});

// 3. GET MY REQUESTS
// CUSTOMER ONLY

router.get("/my", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Only customers can access their requests."
            });
        }

        const requests = await Request.find({
            customerId: req.user.userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Your requests fetched successfully!",
            totalRequests: requests.length,
            requests
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch your requests.",
            error: error.message
        });
    }
});

// 4. UPDATE REQUEST STATUS
// STAFF / ADMIN ONLY

router.put("/status/:id", authMiddleware, async (req, res) => {
    try {
        if (!isStaffOrAdmin(req)) {
            return res.status(403).json({
                message: "Access denied. Staff or admin only."
            });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid request ID."
            });
        }

        const allowedStatuses = [
            "Accepted",
            "Rejected",
            "Completed"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status."
            });
        }

        const request = await Request.findById(id);

        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        const allowedTransitions = {
            Pending: ["Accepted", "Rejected"],
            Accepted: ["Completed"]
        };

        const nextStatuses =
            allowedTransitions[request.status] || [];

        if (!nextStatuses.includes(status)) {
            return res.status(400).json({
                message: `Cannot change status from ${request.status} to ${status}.`
            });
        }

        request.status = status;
        await request.save();

        // Notify customer
        try {
            await Notification.create({
                recipient: request.customerId,
                requestId: request._id,
                title: "Request Status Updated",
                message: `Your request for room ${request.roomNumber} is now ${status}.`,
                type: "request_updated"
            });
        } catch (notificationError) {
            console.error(
                "Customer notification error:",
                notificationError.message
            );
        }

        await request.populate("customerId", "name email phone");

        return res.status(200).json({
            message: "Request status updated successfully!",
            request
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to update request status.",
            error: error.message
        });
    }
});

// 5. CANCEL CUSTOMER REQUEST
// CUSTOMER ONLY

router.put("/cancel/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "customer") {
            return res.status(403).json({
                message: "Only customers can cancel their requests."
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid request ID."
            });
        }

        const request = await Request.findOne({
            _id: id,
            customerId: req.user.userId
        });

        if (!request) {
            return res.status(404).json({
                message: "Request not found."
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                message: "Only pending requests can be cancelled."
            });
        }

        request.status = "Cancelled";
        await request.save();

        return res.status(200).json({
            message: "Request cancelled successfully!",
            request
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to cancel request.",
            error: error.message
        });
    }
});

module.exports = router;