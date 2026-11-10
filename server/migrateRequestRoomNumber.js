require("dotenv").config();
const mongoose = require("mongoose");
const Request = require("./models/Request");

const migrateRequests = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const requests = await Request.collection.find({}).toArray();

        let updated = 0;
        let skipped = 0;

        for (const request of requests) {
            if (typeof request.roomNumber === "string") {
                const roomNumber = Number(request.roomNumber);

                if (Number.isInteger(roomNumber) && roomNumber > 0) {
                    await Request.collection.updateOne(
                        { _id: request._id },
                        { $set: { roomNumber } }
                    );
                    updated++;
                } else {
                    skipped++;
                    console.log("Skipped invalid request:", request._id);
                }
            }
        }

        console.log("Migration completed");
        console.log("Updated:", updated);
        console.log("Skipped:", skipped);

    } catch (error) {
        console.error("Migration failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

migrateRequests();