const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    journey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LearningJourney"
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport"
    },
    targetRole: { type: String, required: true },
    company: { type: String, required: true },
    status: {
        type: String,
        enum: ["NOT_APPLIED", "APPLIED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED", "OFFER", "REJECTED"],
        default: "NOT_APPLIED"
    },
    jobUrl: { type: String, default: "" },
    appliedAt: { type: Date },
    notes: { type: String, default: "" }
}, { timestamps: true });

jobApplicationSchema.index({ user: 1, report: 1 });

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplication;
