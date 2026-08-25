const mongoose = require("mongoose");

const learningActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    journey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LearningJourney"
    },
    dateString: {
        type: String,
        required: true // "YYYY-MM-DD" local date string
    },
    activityType: {
        type: String,
        enum: [
            "DAY_COMPLETED",
            "TASK_COMPLETED",
            "PRACTICE_COMPLETED",
            "QUESTION_ANSWERED",
            "EVIDENCE_ADDED",
            "LOGIN",
            "STUDY_TIME"
        ],
        required: true
    },
    title: { type: String, required: true },
    detail: { type: String, default: "" },
    isQualifying: { type: Boolean, default: false }, // true counts toward daily streak
    activeMinutes: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

learningActivitySchema.index({ user: 1, dateString: 1 });
learningActivitySchema.index({ user: 1, isQualifying: 1, createdAt: -1 });

const LearningActivity = mongoose.model("LearningActivity", learningActivitySchema);

module.exports = LearningActivity;
