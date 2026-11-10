
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },

        checkIn: {
            type: Date,
            required: true
        },

        checkOut: {
            type: Date,
            required: true
        },

        guests: {
            type: Number,
            required: true,
            min: 1
        },

        totalAmount: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed"
        }
    },
    {
        timestamps: true
    }
);

// Improve booking search performance
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
