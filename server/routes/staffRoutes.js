
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

// ======================================
// ADMIN AUTHORIZATION
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
// 1. CREATE STAFF
// POST /api/staff
// ======================================

router.post("/", authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Valid name, email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Invalid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const newStaff = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone: typeof phone === "string" ? phone.trim() : "",
            role: "staff"
        });

        return res.status(201).json({
            message: "Staff created successfully",
            staff: {
                id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                phone: newStaff.phone,
                role: newStaff.role
            }
        });

    } catch (error) {
        console.error("Create Staff Error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            message: "Failed to create staff"
        });
    }
});

// ======================================
// 2. GET ALL STAFF
// GET /api/staff
// ======================================

router.get("/", authMiddleware, adminOnly, async (req, res) => {
    try {
        const staff = await User.find({
            role: "staff"
        })
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Staff fetched successfully",
            count: staff.length,
            staff
        });

    } catch (error) {
        console.error("Get Staff Error:", error.message);

        return res.status(500).json({
            message: "Failed to fetch staff"
        });
    }
});

// ======================================
// 3. UPDATE STAFF
// PUT /api/staff/:id
// ======================================

router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, password } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid staff ID"
            });
        }

        const staff = await User.findOne({
            _id: id,
            role: "staff"
        });

        if (!staff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Invalid staff name"
                });
            }

            staff.name = name.trim();
        }

        if (email !== undefined) {
            if (typeof email !== "string" || !email.trim()) {
                return res.status(400).json({
                    message: "Invalid email"
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return res.status(400).json({
                    message: "Invalid email address"
                });
            }

            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: id }
            });

            if (existingUser) {
                return res.status(409).json({
                    message: "Email already registered"
                });
            }

            staff.email = normalizedEmail;
        }

        if (phone !== undefined) {
            if (typeof phone !== "string") {
                return res.status(400).json({
                    message: "Invalid phone number"
                });
            }

            staff.phone = phone.trim();
        }

        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters"
                });
            }

            // User model pre-save hook will hash this password.
            staff.password = password;
        }

        await staff.save();

        return res.status(200).json({
            message: "Staff updated successfully",
            staff: {
                id: staff._id,
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role
            }
        });

    } catch (error) {
        console.error("Update Staff Error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            message: "Failed to update staff"
        });
    }
});

// ======================================
// 4. DELETE STAFF
// DELETE /api/staff/:id
// ======================================

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid staff ID"
            });
        }

        const deletedStaff = await User.findOneAndDelete({
            _id: id,
            role: "staff"
        });

        if (!deletedStaff) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        // Remove notifications addressed to deleted staff
        await Notification.deleteMany({
            recipient: id
        });

        return res.status(200).json({
            message: "Staff deleted successfully"
        });

    } catch (error) {
        console.error("Delete Staff Error:", error.message);

        return res.status(500).json({
            message: "Failed to delete staff"
        });
    }
});

module.exports = router;
