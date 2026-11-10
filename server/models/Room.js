
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: Number,
        required: true,
        unique: true,
        min: 1
    },

    roomType: {
        type: String,
        required: true,
        enum: ["Single", "Double", "Deluxe", "Suite"]
    },

    pricePerNight: {
        type: Number,
        required: true,
        min: 1
    },

    capacity: {
        type: Number,
        required: true,
        min: 1
    },

    status: {
        type: String,
        enum: ["available", "booked", "maintenance"],
        default: "available"
    },

    description: {
        type: String,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
