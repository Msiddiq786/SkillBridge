const mongoose = require("mongoose");

const practiceAnswerSchema = new mongoose.Schema({
    questionIndex: { type: Number, required: true },
    questionType: { type: String, enum: ["technical", "mcq", "behavioral"], required: true },
    questionText: { type: String },
    category: { type: String },
    difficulty: { type: String },
    userAnswer: { type: String },
    selectedOption: { type: String },
    isCorrect: { type: Boolean },
    isSkipped: { type: Boolean, default: false },
    confidence: { type: String, enum: ["KNOWN", "PARTIAL", "UNKNOWN"] },
    score: { type: Number },
    feedback: {
        score: Number,
        correctness: Number,
        completeness: Number,
        clarity: Number,
        strengths: [String],
        missingPoints: [String],
        missingElements: [String],
        improvementTips: [String],
        improvedAnswer: String,
        starCoverage: {
            situation: Number,
            task: Number,
            action: Number,
            result: Number
        }
    },
    timeSpentSeconds: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const topicPerformanceSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    attempted: { type: Number, default: 0 },
    correctOrKnown: { type: Number, default: 0 },
    score: { type: Number, default: 0 }
}, { _id: false });

const weakTopicSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    score: { type: Number, default: 0 },
    recommendedRoadmapDay: { type: Number },
    roadmapFocus: { type: String }
}, { _id: false });

const practiceSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    interviewReport: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewReport", required: true },
    selectedTrackTitle: { type: String },
    mode: { type: String, enum: ["technical", "mcq", "behavioral", "mixed"], required: true },
    status: { type: String, enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ABANDONED"], default: "IN_PROGRESS" },

    technicalProgress: {
        currentIndex: { type: Number, default: 0 },
        answered: { type: Number, default: 0 },
        skipped: { type: Number, default: 0 },
        completed: { type: Boolean, default: false }
    },
    mcqProgress: {
        currentIndex: { type: Number, default: 0 },
        attempted: { type: Number, default: 0 },
        correct: { type: Number, default: 0 },
        incorrect: { type: Number, default: 0 },
        completed: { type: Boolean, default: false }
    },
    behavioralProgress: {
        currentIndex: { type: Number, default: 0 },
        answered: { type: Number, default: 0 },
        skipped: { type: Number, default: 0 },
        completed: { type: Boolean, default: false }
    },

    answers: [practiceAnswerSchema],
    topicPerformance: [topicPerformanceSchema],
    weakTopics: [weakTopicSchema],

    overallScore: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    completedAt: { type: Date }
}, { timestamps: true });

practiceSessionSchema.index({ user: 1, interviewReport: 1, mode: 1, status: 1 });

const PracticeSession = mongoose.model("PracticeSession", practiceSessionSchema);

module.exports = PracticeSession;
