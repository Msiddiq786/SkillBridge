const { calculateCompletion, buildProfilePersonalizationContext } = require("./services/profile.service");

console.log("================================================================");
console.log("TESTING STUDENTSKILLHUB BRANDING & PROFILE SERVICES");
console.log("================================================================");

// 1. Test Completion Calculation
const sampleProfile = {
    personalDetails: {
        fullName: "Mohammed Siddiq",
        headline: "AI/ML Student & Software Engineer",
        targetRole: "AI/ML Intern",
        location: "Chennai, India",
        bio: "Passionate CS student specializing in LLMs and full-stack development."
    },
    education: [
        {
            degree: "B.Tech Computer Science",
            university: "Anna University",
            gradYear: 2026,
            cgpa: "8.8"
        }
    ],
    skills: [
        { name: "Python", category: "Technical", level: "Advanced", evidenceType: "VERIFIED", source: "Resume" },
        { name: "PyTorch", category: "AI/ML", level: "Intermediate", evidenceType: "VERIFIED", source: "Project" },
        { name: "RAG", category: "AI/ML", level: "Beginner", evidenceType: "SELF_DECLARED", source: "Self-added" },
        { name: "React", category: "Web", level: "Intermediate", evidenceType: "SELF_DECLARED", source: "Self-added" }
    ],
    projects: [
        {
            name: "SkillBridge AI Assistant",
            technologies: ["React", "Node.js", "Gemini API", "MongoDB"],
            whatIBuilt: "Interactive AI interview preparation platform",
            keyOutcome: "Helped 100+ candidates prepare for technical interviews",
            status: "Completed"
        }
    ],
    experience: [
        {
            company: "Tech Corp",
            role: "Software Engineering Intern",
            type: "Internship"
        }
    ],
    languages: [
        { language: "English", proficiency: "Fluent" },
        { language: "Tamil", proficiency: "Native" }
    ],
    resumeData: {
        fileName: "siddiq_resume.pdf",
        parsedTextSnippet: "Experienced in Python and AI..."
    },
    careerGoals: {
        targetRole: "AI/ML Intern",
        workPreference: "Hybrid",
        experienceLevel: "Internship"
    },
    preferences: {
        useProfileForAi: true
    }
};

const completionResult = calculateCompletion(sampleProfile);
console.log(`✓ Profile Completeness Score: ${completionResult.score}%`);
console.log(`✓ Missing Checklist Count: ${completionResult.missing.length}`);
if (completionResult.score < 80) {
    throw new Error(`Expected score >= 80%, got ${completionResult.score}%`);
}

// 2. Test Personalization Context Generation with Evidence Hierarchy
const context = buildProfilePersonalizationContext(sampleProfile);
console.log("\nGenerated AI Supplemental Profile Context:\n", context);

if (!context.includes("Verified Skills: Python (Advanced), PyTorch (Intermediate)")) {
    throw new Error("Missing verified skills in context");
}

if (!context.includes("Self-Declared / Learning Skills: RAG (Beginner), React (Intermediate)")) {
    throw new Error("Missing self-declared skills in context");
}

if (!context.includes("SkillBridge AI Assistant")) {
    throw new Error("Missing verified projects in context");
}

console.log("✓ Evidence hierarchy strictly preserved (Verified vs Self-Declared).");

// 3. Test App Route Mounting
try {
    const app = require("./app");
    console.log("✓ app.js resolved all routers successfully (/api/auth, /api/interview, /api/practice, /api/progress, /api/profile).");
} catch (e) {
    console.error("App router loading failed:", e);
    process.exit(1);
}

console.log("\n================================================================");
console.log("ALL STUDENTSKILLHUB PROFILE TESTS PASSED SUCCESSFULLY! ✓");
console.log("================================================================\n");
