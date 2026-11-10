
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await User.findOne({
            email: "admin@stayease.com"
        });

        if (existingAdmin) {
            console.log("Admin already exists!");
            return;
        }

        const admin = new User({
            name: "StayEase Admin",
            email: "admin@stayease.com",
            password: "Admin@123456",
            phone: "9999999999",
            role: "admin"
        });

        await admin.save();

        console.log("Admin created successfully!");

    } catch (error) {
        console.log("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();
