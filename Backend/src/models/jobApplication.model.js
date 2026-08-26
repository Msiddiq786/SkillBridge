const mongoose = require("mongoose");

const applicationTimelineEventSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, default: "" }
}, { _id: false });

const readinessSnapshotSchema = new mongoose.Schema({
    jdMatch: { type: Number, default: 0 },
    verifiedSkillsCount: { type: Number, default: 0 },
    requiredSkillsCount: { type: Number, default: 0 },
    roadmapCompletedDays: { type: Number, default: 0 },
    roadmapTotalDays: { type: Number, default: 15 },
    practiceScore: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    resumeAlignmentScore: { type: Number, default: 0 },
    status: { type: String, default: "READY TO APPLY" },
    capturedAt: { type: Date, default: Date.now }
}, { _id: false });

const resumeVersionUsedSchema = new mongoose.Schema({
    versionId: { type: String, default: "" },
    versionNumber: { type: Number, default: 1 },
    versionName: { type: String, default: "JD-Ready Resume" }
}, { _id: false });

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
        enum: [
            "SAVED",
            "PREPARING",
            "READY_TO_APPLY",
            "APPLIED",
            "ASSESSMENT",
            "INTERVIEW",
            "OFFER",
            "REJECTED",
            "WITHDRAWN",
            // Backwards compatibility aliases
            "NOT_APPLIED",
            "INTERVIEW_SCHEDULED",
            "INTERVIEW_COMPLETED"
        ],
        default: "PREPARING"
    },
    jobUrl: { type: String, default: "" },
    appliedAt: { type: Date },
    interviewDate: { type: Date },
    recruiterName: { type: String, default: "" },
    recruiterEmail: { type: String, default: "" },
    notes: { type: String, default: "" },
    timeline: [applicationTimelineEventSchema],
    readinessSnapshot: readinessSnapshotSchema,
    resumeVersionUsed: resumeVersionUsedSchema
}, { timestamps: true });

jobApplicationSchema.index({ user: 1, report: 1 });
jobApplicationSchema.index({ user: 1, status: 1 });

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplication;
