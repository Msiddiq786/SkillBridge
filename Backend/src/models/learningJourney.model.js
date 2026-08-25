const mongoose = require("mongoose");

const dayTaskProgressSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    status: {
        type: String,
        enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
        default: "NOT_STARTED"
    },
    completedTasks: [{ type: Number }], // indices of completed tasks in this day
    notes: { type: String, default: "" },
    startedAt: { type: Date },
    completedAt: { type: Date }
}, { _id: false });

const learningJourneySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        required: true
    },
    targetRole: { type: String, required: true },
    company: { type: String, default: "" },
    selectedTrack: { type: String, default: "" },
    roadmapDays: { type: Number, default: 15 },
    currentDay: { type: Number, default: 1 },
    completedDays: [{ type: Number }], // e.g. [1, 2]
    dayProgress: [dayTaskProgressSchema],
    overallProgress: { type: Number, default: 0 }, // 0 - 100%
    currentFocus: { type: String, default: "" },
    status: {
        type: String,
        enum: ["NOT_STARTED", "ACTIVE", "COMPLETED", "PAUSED"],
        default: "ACTIVE"
    },
    isPrimary: { type: Boolean, default: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
    totalActiveMinutes: { type: Number, default: 0 }
}, { timestamps: true });

learningJourneySchema.index({ user: 1, report: 1 });
learningJourneySchema.index({ user: 1, isPrimary: 1, status: 1 });

const LearningJourney = mongoose.model("LearningJourney", learningJourneySchema);

module.exports = LearningJourney;
