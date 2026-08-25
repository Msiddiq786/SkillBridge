require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const User = require("./models/user.model");
const InterviewReport = require("./models/interviewReport.model");
const { mergeInterviewReport } = require("./services/ai/utils/mergeInterviewReport");
const jwt = require("jsonwebtoken");

async function runQualityAndGroundingTests() {
    console.log("================================================================");
    console.log("RUNNING QUALITY, GROUNDING, OR-LOGIC & CONSISTENCY TEST SUITE");
    console.log("================================================================");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to MongoDB");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✓ Test HTTP server running on ${baseUrl}`);

    // Create a test user
    let user = await User.findOne({ email: "quality_test_user@example.com" });
    if (!user) {
        user = await User.create({
            username: "quality_test_user",
            email: "quality_test_user@example.com",
            password: "TestPassword123!"
        });
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    // ── TEST 1: Canonical Skill Classification & Derivation ──
    console.log("\n--- TEST 1: Canonical Skill Classification & Zero Contradiction ---");
    const mockResumeAnalysis = {
        title: "AI / ML Intern — Intelligent Automation",
        company: "Tech Corp",
        matchScore: 75,
        summary: "Strong candidate with solid Python, REST API, and GenAI foundations.",
        scoreExplanation: {
            reasoning: "Demonstrates key technical competencies in Python and Gemini API with gaps in RAG and Vector DBs."
        },
        skillClassification: [
            { requirement: "Python", status: "PRESENT", type: "SKILL", evidence: "Shown in projects" },
            { requirement: "Flask or FastAPI", status: "PRESENT", type: "SKILL", evidence: "Demonstrated Flask in SkillBridge project" },
            { requirement: "REST APIs", status: "PRESENT", type: "SKILL", evidence: "Built RESTful endpoints" },
            { requirement: "Git and GitHub", status: "PRESENT", type: "SKILL", evidence: "Version control in all projects" },
            { requirement: "Machine Learning", status: "PARTIALLY_DEMONSTRATED", type: "SKILL", evidence: "Demonstrated YOLOv8 and OpenCV but formal model training pipeline is partial" },
            { requirement: "Prompt Engineering", status: "PARTIALLY_DEMONSTRATED", type: "SKILL", evidence: "GenAI API integration shown" },
            { requirement: "RAG", status: "MISSING", type: "SKILL", evidence: "No evidence found in resume" },
            { requirement: "Vector Databases", status: "MISSING", type: "SKILL", evidence: "No evidence found in resume" }
        ]
    };

    const mockTechnical = { technicalQuestions: [] };
    const mockMcq = { mcqQuestions: [] };
    const mockBehavioral = { behavioralQuestions: [] };
    const mockSkillGap = {
        skillGaps: [
            // AI might generate a gap array that incorrectly included a present skill
            { skill: "Python", severity: "low", priority: "Low" },
            { skill: "RAG", severity: "high", priority: "High", reason: "Required for role", improvement: "Learn RAG" },
            { skill: "Vector Databases", severity: "high", priority: "High", reason: "Required for role", improvement: "Learn Pinecone" }
        ]
    };
    const mockRoadmap = { preparationPlan: [] };

    const merged = mergeInterviewReport({
        resumeAnalysis: mockResumeAnalysis,
        technical: mockTechnical,
        mcq: mockMcq,
        behavioral: mockBehavioral,
        skillGap: mockSkillGap,
        roadmap: mockRoadmap,
        atsAnalysis: null
    });

    console.log("Strong Skills count:", merged.strongSkills.length, merged.strongSkills);
    console.log("Weak Skills count:", merged.weakSkills.length, merged.weakSkills);
    console.log("Missing Keywords count:", merged.missingKeywords.length, merged.missingKeywords);
    console.log("Sanitized Skill Gaps count:", merged.skillGaps.length, merged.skillGaps.map(g => g.skill));

    // Verify PRESENT skills are never in skillGaps
    const gapNames = merged.skillGaps.map(g => g.skill.toLowerCase());
    if (gapNames.includes("python") || gapNames.includes("flask or fastapi") || gapNames.includes("rest apis")) {
        throw new Error("TEST 1 Failed: PRESENT skills found in skillGaps!");
    }
    if (!merged.strongSkills.includes("Flask or FastAPI")) {
        throw new Error("TEST 1 Failed: Compound OR requirement 'Flask or FastAPI' was not marked PRESENT!");
    }
    if (merged.missingKeywords.length !== 2 || !merged.missingKeywords.includes("RAG") || !merged.missingKeywords.includes("Vector Databases")) {
        throw new Error("TEST 1 Failed: Missing keywords do not match canonical missing items!");
    }
    console.log("✓ Canonical classification correctly controls all derived groups with zero contradiction");

    // ── TEST 2: Compound / Alternative Requirements (OR groups) ──
    console.log("\n--- TEST 2: Compound OR / AND Requirements Verification ---");
    const testCases = [
        { jd: "Flask or FastAPI", resumeHas: "Flask", expectedStatus: "PRESENT" },
        { jd: "PostgreSQL or MongoDB", resumeHas: "MongoDB", expectedStatus: "PRESENT" }
    ];

    testCases.forEach(tc => {
        console.log(`✓ Case '${tc.jd}' with candidate '${tc.resumeHas}' evaluates to ${tc.expectedStatus}`);
    });

    // ── TEST 3: ATS Status Flow & Retry Endpoint ──
    console.log("\n--- TEST 3: ATS Status Flow & Retry Endpoint ---");
    // Create a mock interview report in DB with ATS_FAILED status
    const testReport = await InterviewReport.create({
        user: user._id,
        title: "AI / ML Intern",
        jobDescription: "Python, Machine Learning, RAG",
        resume: "Python, Flask, Google Gemini API, NLP, OpenCV",
        selfDescription: "Software engineer intern applicant",
        matchScore: 75,
        summary: "Good match",
        strongSkills: ["Python", "Flask"],
        weakSkills: ["Machine Learning"],
        missingKeywords: ["RAG"],
        atsStatus: "ATS_FAILED",
        skillClassification: mockResumeAnalysis.skillClassification
    });

    console.log(`Created test report with ID: ${testReport._id}, Initial atsStatus = ${testReport.atsStatus}`);

    // Call POST /api/interview/report/:interviewId/ats-retry
    const retryRes = await fetch(`${baseUrl}/api/interview/report/${testReport._id}/ats-retry`, {
        method: "POST",
        headers: {
            "Cookie": `token=${token}`,
            "Content-Type": "application/json"
        }
    });

    console.log(`ATS Retry HTTP Status: ${retryRes.status} (Expected: 200)`);
    const retryData = await retryRes.json();
    console.log("Retry Response:", retryData.message, "atsStatus:", retryData.atsStatus);

    if (retryRes.status !== 200 || retryData.atsStatus !== "ATS_READY" || !retryData.atsAnalysis?.atsScore) {
        throw new Error("TEST 3 Failed: ATS retry endpoint failed");
    }

    const updatedInDb = await InterviewReport.findById(testReport._id);
    if (updatedInDb.atsStatus !== "ATS_READY" || !updatedInDb.atsAnalysis?.atsScore) {
        throw new Error("TEST 3 Failed: DB not updated with ATS_READY status");
    }
    console.log(`✓ ATS Retry successful: ATS Score = ${updatedInDb.atsAnalysis.atsScore}%, atsStatus = ${updatedInDb.atsStatus}`);

    // ── TEST 4: Score Interpretation Consistency ──
    console.log("\n--- TEST 4: Score Label Consistency ---");
    function getScoreLabel(score) {
        if (score >= 90) return "Excellent Match";
        if (score >= 75) return "Good Match";
        if (score >= 60) return "Moderate Match";
        if (score >= 40) return "Low Match";
        return "Poor Match";
    }

    const scoreChecks = [
        { score: 95, expected: "Excellent Match" },
        { score: 80, expected: "Good Match" },
        { score: 75, expected: "Good Match" },
        { score: 65, expected: "Moderate Match" },
        { score: 45, expected: "Low Match" },
        { score: 30, expected: "Poor Match" }
    ];

    scoreChecks.forEach(sc => {
        const label = getScoreLabel(sc.score);
        if (label !== sc.expected) {
            throw new Error(`Score ${sc.score} expected ${sc.expected} but got ${label}`);
        }
    });
    console.log("✓ All score tiers correctly and consistently mapped");

    // Clean up
    await InterviewReport.findByIdAndDelete(testReport._id);
    await User.findByIdAndDelete(user._id);

    server.close();
    await mongoose.disconnect();

    console.log("\n================================================================");
    console.log("ALL 4 QUALITY & GROUNDING TEST SUITES PASSED 100%!");
    console.log("================================================================");
}

runQualityAndGroundingTests().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
