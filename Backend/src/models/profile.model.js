const mongoose = require("mongoose");

const educationItemSchema = new mongoose.Schema({
    degree: { type: String, default: "" },
    university: { type: String, default: "" },
    specialization: { type: String, default: "" },
    startYear: { type: Number },
    gradYear: { type: Number },
    cgpa: { type: String, default: "" },
    coursework: [{ type: String }]
}, { _id: true });

const skillItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, default: "Technical" }, // "Technical", "AI/ML", "Web", "Tools", "Core"
    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Intermediate"
    },
    evidenceType: {
        type: String,
        enum: ["VERIFIED", "SELF_DECLARED", "NEEDS_EVIDENCE"],
        default: "SELF_DECLARED"
    },
    source: { type: String, default: "Self-added" } // "Resume", "Project", "Internship", "Certification", "Self-added"
}, { _id: true });

const languageItemSchema = new mongoose.Schema({
    language: { type: String, required: true },
    proficiency: {
        type: String,
        enum: ["Basic", "Intermediate", "Fluent", "Native"],
        default: "Fluent"
    }
}, { _id: true });

const projectItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    technologies: [{ type: String }],
    githubUrl: { type: String, default: "" },
    demoUrl: { type: String, default: "" },
    role: { type: String, default: "Creator / Developer" },
    whatIBuilt: { type: String, default: "" },
    keyOutcome: { type: String, default: "" },
    skillsDemonstrated: [{ type: String }],
    status: {
        type: String,
        enum: ["Idea", "In Progress", "Completed"],
        default: "Completed"
    }
}, { _id: true });

const experienceItemSchema = new mongoose.Schema({
    company: { type: String, required: true },
    role: { type: String, required: true },
    type: {
        type: String,
        enum: ["Internship", "Part-time", "Freelance", "Volunteer", "Research", "Full-time", "Academic"],
        default: "Internship"
    },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    current: { type: Boolean, default: false },
    description: { type: String, default: "" },
    technologies: [{ type: String }],
    responsibilities: [{ type: String }],
    achievements: [{ type: String }]
}, { _id: true });

const certificationItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    issuer: { type: String, default: "" },
    date: { type: String, default: "" },
    credentialUrl: { type: String, default: "" }
}, { _id: true });

const achievementItemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: String, default: "" },
    evidenceUrl: { type: String, default: "" },
    category: {
        type: String,
        enum: ["Hackathon", "Competition", "Award", "Scholarship", "Leadership", "Academic", "Other"],
        default: "Hackathon"
    }
}, { _id: true });

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    personalDetails: {
        fullName: { type: String, default: "" },
        headline: { type: String, default: "" },
        targetRole: { type: String, default: "" },
        bio: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        location: { type: String, default: "" },
        avatar: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        github: { type: String, default: "" },
        portfolio: { type: String, default: "" }
    },
    education: [educationItemSchema],
    skills: [skillItemSchema],
    languages: [languageItemSchema],
    projects: [projectItemSchema],
    experience: [experienceItemSchema],
    certifications: [certificationItemSchema],
    achievements: [achievementItemSchema],
    careerGoals: {
        targetRole: { type: String, default: "" },
        preferredRoles: [{ type: String }],
        preferredIndustries: [{ type: String }],
        preferredLocations: [{ type: String }],
        workPreference: {
            type: String,
            enum: ["On-site", "Hybrid", "Remote", "Flexible"],
            default: "Hybrid"
        },
        experienceLevel: {
            type: String,
            enum: ["Internship", "Fresher", "Entry Level", "Junior"],
            default: "Internship"
        },
        targetSkills: [{ type: String }]
    },
    resumeData: {
        fileName: { type: String, default: "" },
        uploadedAt: { type: Date },
        lastAnalyzedAt: { type: Date },
        parsedTextSnippet: { type: String, default: "" },
        status: { type: String, default: "Not Uploaded" }
    },
    preferences: {
        useProfileForAi: { type: Boolean, default: true }
    },
    completionPercentage: { type: Number, default: 0 }
}, { timestamps: true });

const ProfileModel = mongoose.model("profiles", profileSchema);

module.exports = ProfileModel;
