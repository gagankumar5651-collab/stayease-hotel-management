const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        roomNumber: {
            type: Number,
            required: true,
            min: 1
        },

        requestType: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: "",
            trim: true
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Accepted",
                "Rejected",
                "Completed",
                "Cancelled"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;