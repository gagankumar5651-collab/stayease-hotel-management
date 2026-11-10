
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ======================================
// REGISTER API
// POST /api/auth/register
// ======================================

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Required field validation
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

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        // Duplicate email check
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        // Create customer account
        // Role is intentionally not accepted from request body.
        const newUser = new User({
            name: normalizedName,
            email: normalizedEmail,
            password,
            phone: typeof phone === "string" ? phone.trim() : ""
        });

        await newUser.save();

        return res.status(201).json({
            message: "User registered successfully!",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error("Registration Error:", error.message);

        // Handle duplicate email race condition
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        return res.status(500).json({
            message: "Server error during registration"
        });
    }
});

// ======================================
// LOGIN API
// POST /api/auth/login
// ======================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Valid email and password are required"
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in .env file");

            return res.status(500).json({
                message: "Authentication configuration error"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare password with stored hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error.message);

        return res.status(500).json({
            message: "Server error during login"
        });
    }
});

module.exports = router;
