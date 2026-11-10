
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// 1. GET MY NOTIFICATIONS
// GET /api/notifications?page=1&limit=20
// ======================================

router.get("/", authMiddleware, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );

        const skip = (page - 1) * limit;

        const recipient = req.user.userId;

        const [
            notifications,
            totalNotifications,
            unreadCount
        ] = await Promise.all([

            Notification.find({ recipient })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Notification.countDocuments({ recipient }),

            Notification.countDocuments({
                recipient,
                isRead: false
            })
        ]);

        return res.status(200).json({
            message: "Notifications fetched successfully!",
            totalNotifications,
            unreadCount,
            currentPage: page,
            totalPages: Math.ceil(totalNotifications / limit),
            notifications
        });

    } catch (error) {
        console.error("Get Notifications Error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch notifications."
        });
    }
});

// ======================================
// 2. MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/read/:id
// ======================================

router.put("/read/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid notification ID."
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                recipient: req.user.userId
            },
            {
                $set: { isRead: true }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found."
            });
        }

        return res.status(200).json({
            message: "Notification marked as read!",
            notification
        });

    } catch (error) {
        console.error("Mark Notification Read Error:", error.message);

        return res.status(500).json({
            message: "Failed to update notification."
        });
    }
});

// ======================================
// 3. MARK ALL NOTIFICATIONS AS READ
// PUT /api/notifications/read-all
// ======================================

router.put("/read-all", authMiddleware, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                recipient: req.user.userId,
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        return res.status(200).json({
            message: "All notifications marked as read!",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Mark All Read Error:", error.message);

        return res.status(500).json({
            message: "Failed to update notifications."
        });
    }
});

module.exports = router;
