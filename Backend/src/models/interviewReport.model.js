const mongoose = require("mongoose");

/* ---------------- Technical Questions ---------------- */
const technicalQuestionSchema = new mongoose.Schema({
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    category: String,
    estimatedInterviewTime: String,
    question: { type: String, required: true },
    intention: { type: String },
    oneLineAnswer: String,
    simpleExplanation: String,
    easyExample: String,
    realWorldExample: String,
    interviewAnswer: String,
    answer: String,
    commonMistakes: [String],
    followUpQuestions: [String],
    resources: [String]
}, { _id: false });

/* ---------------- MCQ Questions ---------------- */
const mcqQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    category: String,
    options: [String],
    correctAnswer: { type: String, required: true },
    explanation: String,
    resource: String
}, { _id: false });

/* ---------------- Behavioral Questions ---------------- */
const behavioralQuestionSchema = new mongoose.Schema({
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    question: { type: String, required: true },
    intention: { type: String },
    howToAnswer: String,
    situation: String,
    task: String,
    action: String,
    result: String,
    interviewAnswer: String,
    answer: String,
    commonMistakes: [String],
    followUpQuestions: [String]
}, { _id: false });

/* ---------------- Skill Gap ---------------- */
const skillGapSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true },
    priority: String,
    reason: String,
    improvement: String,
    estimatedLearningTime: String,
    resources: [String]
}, { _id: false });

/* ---------------- Roadmap ---------------- */
const preparationPlanSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    difficulty: String,
    estimatedStudyTime: String,
    tasks: [String],
    resources: [String],
    expectedOutcome: String
}, { _id: false });

/* ---------------- ATS Analysis ---------------- */
const atsAnalysisSchema = new mongoose.Schema({
    atsScore: Number,
    keywordMatch: [String],
    missingKeywords: [String],
    strongKeywords: [String],
    weakKeywords: [String],
    resumeStrengths: [String],
    resumeWeaknesses: [String],
    improvementSuggestions: [String]
}, { _id: false });

/* ---------------- Score Explanation ---------------- */
const scoreExplanationSchema = new mongoose.Schema({
    strengths: [String],
    partial: [String],
    gaps: [String],
    reasoning: String
}, { _id: false });

/* ---------------- Skill Classification ---------------- */
const skillClassificationSchema = new mongoose.Schema({
    requirement: { type: String },
    skill: { type: String },
    type: { type: String },
    status: { type: String, enum: ["PRESENT", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED", "MISSING"] },
    evidence: String
}, { _id: false });

/* ---------------- Interview Report ---------------- */
const interviewReportSchema = new mongoose.Schema({
    jobDescription: { type: String, required: true },
    resume: String,
    selfDescription: String,
    selectedTrack: String,
    selectedTrackTitle: String,
    selectedTrackDetails: String,
    title: { type: String, required: true },
    company: String,
    matchScore: { type: Number, min: 0, max: 100 },
    summary: String,
    strongSkills: [String],
    weakSkills: [String],
    missingKeywords: [String],
    scoreExplanation: scoreExplanationSchema,
    skillClassification: [skillClassificationSchema],
    nextSteps: [String],
    technicalQuestions: [technicalQuestionSchema],
    mcqQuestions: [mcqQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    atsAnalysis: atsAnalysisSchema,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }
}, { timestamps: true });

module.exports = mongoose.model("InterviewReport", interviewReportSchema);