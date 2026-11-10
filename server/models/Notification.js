
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            default: null
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        type: {
            type: String,
            enum: ["request_created", "request_updated"],
            required: true
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Faster notification queries
notificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1
});

module.exports = mongoose.model("Notification", notificationSchema);
