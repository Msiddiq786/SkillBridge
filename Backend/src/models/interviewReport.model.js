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
    howToSayIt: String,
    interviewAnswer: String,
    answer: String,
    commonMistakes: [String],
    followUpQuestions: [String],
    quickMemoryTip: String,
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
    whatTheyAreAsking: String,
    howToThink: String,
    starBreakdown: {
        situation: String,
        task: String,
        action: String,
        result: String
    },
    simpleExample: String,
    realWorldExample: String,
    howToSayIt: String,
    intention: { type: String },
    howToAnswer: String,
    situation: String,
    task: String,
    action: String,
    result: String,
    interviewAnswer: String,
    answer: String,
    commonMistakes: [String],
    followUpQuestions: [String],
    quickTemplate: String
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
    whyThisMatters: String,
    gapAddressed: String,
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

/* ---------------- Recommended Projects ---------------- */
const recommendedProjectSchema = new mongoose.Schema({
    num: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "🚀" },
    targetRole: { type: String, default: "" },
    realWorldProblem: { type: String, required: true },
    whatYouBuild: { type: String, required: true },
    responsibilities: [{ type: String }],
    skills: [{ type: String }],
    whyThisProject: { type: String, required: true },
    suggestedFeatures: [{ type: String }],
    resumeBoost: { type: String, required: true },
    expectedEvidence: [{ type: String }],
    estimatedDuration: { type: String, default: "5-7 days" },
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Intermediate" },
    jdRequirementsCovered: [{ type: String }],
    candidateGapsAddressed: [{ type: String }],
    roadmapConnections: [{ type: String }],
    canonicalSkillIds: [{ type: String }],
    status: {
        type: String,
        enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
        default: "NOT_STARTED"
    }
}, { _id: false });

/* ---------------- Score Explanation ---------------- */
const scoreExplanationSchema = new mongoose.Schema({
    score: Number,
    counts: {
        strong: Number,
        partial: Number,
        notDemonstrated: Number,
        missing: Number,
        skillGapsCount: Number,
        responsibilityGapsCount: Number
    },
    strengths: [String],
    demonstratedResponsibilities: [String],
    partial: [String],
    partialResponsibilities: [String],
    notDemonstrated: [String],
    notDemonstratedResponsibilities: [String],
    missing: [String],
    missingResponsibilities: [String],
    gaps: [String],
    reasoning: String
}, { _id: false });

/* ---------------- Skill Classification ---------------- */
const skillClassificationSchema = new mongoose.Schema({
    requirement: { type: String },
    skill: { type: String },
    normalizedRequirement: { type: String },
    type: { type: String },
    status: { type: String, enum: ["PRESENT", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED", "MISSING"] },
    evidence: String,
    reason: String,
    relatedRequirements: [String]
}, { _id: false });

/* ---------------- Plan Configuration ---------------- */
const planConfigSchema = new mongoose.Schema({
    technicalCount: { type: Number, default: 20 },
    mcqCount: { type: Number, default: 15 },
    behavioralCount: { type: Number, default: 10 },
    technicalFollowUpsPerQuestion: { type: Number, default: 5 },
    roadmapDays: { type: Number, default: 15 },
    technicalDifficulty: {
        easy: { type: Number, default: 7 },
        medium: { type: Number, default: 8 },
        hard: { type: Number, default: 5 }
    },
    mcqDifficulty: {
        easy: { type: Number, default: 6 },
        medium: { type: Number, default: 6 },
        hard: { type: Number, default: 3 }
    },
    behavioralDifficulty: {
        easy: { type: Number, default: 4 },
        medium: { type: Number, default: 4 },
        hard: { type: Number, default: 2 }
    },
    includeTechnical: { type: Boolean, default: true },
    includeMCQ: { type: Boolean, default: true },
    includeBehavioral: { type: Boolean, default: true },
    roadmapIntensity: { type: String, default: "balanced" },
    focusAreas: [String]
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
    planConfig: planConfigSchema,
    technicalQuestions: [technicalQuestionSchema],
    mcqQuestions: [mcqQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    whyTheseProjects: { type: String, default: "" },
    recommendedProjects: [recommendedProjectSchema],
    atsStatus: {
        type: String,
        enum: ["ATS_PENDING", "ATS_GENERATING", "ATS_READY", "ATS_FAILED"],
        default: "ATS_PENDING"
    },
    atsAnalysis: atsAnalysisSchema,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true }
}, { timestamps: true });

module.exports = mongoose.model("InterviewReport", interviewReportSchema);