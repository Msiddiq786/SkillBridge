const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    progress: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "IDLE"
    },
    stage: {
        type: String,
        default: "START"
    },
    stages: {
        readingResume: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" },
        resumeAnalysis: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" },
        technical: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" },
        mcq: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" },
        behavioral: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" },
        skillGap: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" },
        roadmap: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" },
        finalizing: { type: String, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"], default: "PENDING" }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Progress", progressSchema);