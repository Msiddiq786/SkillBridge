/**
 * Canonical Classification & Skill Gap Quality Pass Test Suite
 */

require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const User = require("./models/user.model");
const InterviewReport = require("./models/interviewReport.model");
const { generateInterviewReport } = require("./services/ai.service");
const jwt = require("jsonwebtoken");

const SOURCE_RESUME = `
MUHAMMAD SIDDIQ
msiddiq786@gmail.com | +92 300 1234567 | Lahore, Pakistan
github.com/Msiddiq786 | linkedin.com/in/msiddiq786

EDUCATION
FAST National University of Computer and Emerging Sciences, Lahore
Bachelor of Science in Computer Science (BS CS) — CGPA: 3.4/4.0 | 2022 – 2026

TECHNICAL SKILLS
- Programming Languages: Python, C++, JavaScript, SQL
- Web & Backend: React.js, Node.js, Express.js, Flask, REST APIs
- Databases & Storage: MongoDB, Mongoose, SQLite, Redis
- AI & Libraries: Google Gemini API, NLP, YOLOv8, OpenCV
- Developer Tools: Git, GitHub, Postman, VS Code

EXPERIENCE
Python Developer Intern — TechSoft Solutions (June 2024 – August 2024)
- Developed Python scripts for internal automation and data processing tasks.
- Applied Object-Oriented Programming (OOP) and Data Structures & Algorithms (DSA) principles to optimize legacy routines.
- Assisted senior engineers with code debugging, unit testing, and performance profiling.

PROJECTS
SkillBridge — AI-Powered Interview Preparation Platform
- Developed a full-stack career preparation platform using React.js, Node.js, Express.js, and MongoDB.
- Integrated Google Gemini API to analyze candidate resumes against job descriptions and generate structured interview questions.
- Implemented JWT authentication, role-based access, and Redis caching for optimized report fetching.
- Built interactive practice simulator supporting MCQ, Technical, and Behavioral tracks.

AI Security & Attendance System
- Built an automated face detection and attendance logging application using Python, YOLOv8, and OpenCV.
- Implemented local attendance record management with SQLite database.
- Created a Flask web interface for viewing student/employee check-in logs in real time.
`;

const TARGET_JD = `
Job Title: AI / ML Intern — Intelligent Automation
Company: NextGen Systems

Responsibilities:
- Build and evaluate machine learning models for document processing.
- Implement RAG (Retrieval-Augmented Generation) pipelines and vector database integrations.
- Develop prompt engineering workflows for LLM applications.
- Build REST APIs with Flask or FastAPI for model serving.
- Write clean Python code and document experiments.
- Work with REST APIs to integrate AI services.

Requirements:
- Strong programming skills in Python.
- Knowledge of Machine Learning, Computer Vision, and Data Analysis.
- Experience with Generative AI / LLM APIs (Gemini, OpenAI).
- Familiarity with REST APIs, Git, and database systems (SQL / NoSQL).
- Experience with RAG, Vector Databases (Pinecone, ChromaDB), Docker, FastAPI is a plus.
`;

async function runCanonicalClassificationTest() {
    console.log("================================================================");
    console.log("RUNNING CANONICAL CLASSIFICATION & QUALITY PASS TEST SUITE");
    console.log("================================================================\n");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to MongoDB");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✓ Test HTTP server running on ${baseUrl}\n`);

    const uniqueSuffix = Date.now();
    const testUser = await User.create({
        username: `class_user_${uniqueSuffix}`,
        email: `class_${uniqueSuffix}@example.com`,
        password: "TestPassword123!"
    });

    const userToken = jwt.sign(
        { id: testUser._id, username: testUser.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    console.log("--- Step 1: Generating Fresh Interview Report ---");
    const { report } = await generateInterviewReport({
        resume: SOURCE_RESUME,
        selfDescription: "Computer Science student with experience in Python, GenAI integrations, and full-stack web development.",
        jobDescription: TARGET_JD,
        userId: testUser._id
    });

    console.log(`✓ Report Generated. Match Score: ${report.matchScore}%`);

    // ── Test 1: Canonical Classification Model Verification ──
    console.log("\n--- TEST 1: Canonical Requirement Model ---");
    const classification = report.skillClassification || [];
    console.log(`Total Classified Requirements: ${classification.length}`);
    if (classification.length < 8) {
        throw new Error(`TEST 1 Failed: Expected at least 8 classified requirements, got ${classification.length}`);
    }

    for (const item of classification) {
        if (!item.requirement || !item.type || !item.status) {
            throw new Error(`TEST 1 Failed: Malformed classification item: ${JSON.stringify(item)}`);
        }
    }
    console.log("✓ TEST 1 Passed: All items conform to canonical requirement model");

    // ── Test 2: Strict Separation of Skills vs Responsibilities ──
    console.log("\n--- TEST 2: Strict Separation of Skills vs Responsibilities ---");
    const strongSkills = report.strongSkills || [];
    const demonstratedResponsibilities = report.demonstratedResponsibilities || [];

    console.log("Strong Skills (Skills ONLY):", strongSkills);
    console.log("Demonstrated Responsibilities (Tasks ONLY):", demonstratedResponsibilities);

    // Verify strong skills do not contain responsibility phrases
    for (const s of strongSkills) {
        const isActionPhrase = /^(work with|write clean|build and|develop simple|experiment with|collaborate)/i.test(s);
        if (isActionPhrase) {
            throw new Error(`TEST 2 Failed: Strong skills contains a responsibility: "${s}"`);
        }
    }
    console.log("✓ TEST 2 Passed: Strong skills contain only concrete tools/languages (no action phrases)");

    // ── Test 3: RAG Gap Consolidation ──
    console.log("\n--- TEST 3: RAG Gap Consolidation ---");
    const skillGaps = report.skillGaps || [];
    const ragGaps = skillGaps.filter(g => (g.skill || '').toLowerCase().includes('rag'));
    console.log(`RAG Gaps in Report: ${ragGaps.length}`);
    if (ragGaps.length > 1) {
        throw new Error(`TEST 3 Failed: Multiple duplicate RAG gaps displayed: ${JSON.stringify(ragGaps.map(g => g.skill))}`);
    }
    console.log("✓ TEST 3 Passed: RAG gaps consolidated into 1 canonical entry");

    // ── Test 4: Structured Score Explanation Consistency ──
    console.log("\n--- TEST 4: Score Explanation Consistency ---");
    const scoreExp = report.scoreExplanation;
    if (!scoreExp || !scoreExp.counts) {
        throw new Error("TEST 4 Failed: Score explanation missing structured counts");
    }
    console.log("Score Explanation Counts:", scoreExp.counts);
    console.log("Score Explanation Reasoning:", scoreExp.reasoning);

    const totalDerived = scoreExp.counts.strong + scoreExp.counts.partial + scoreExp.counts.notDemonstrated + scoreExp.counts.missing;
    console.log(`Total Classified: ${classification.length}, Total Derived Counts: ${totalDerived}`);
    if (totalDerived !== classification.length) {
        throw new Error(`TEST 4 Failed: Derived count sum (${totalDerived}) != classification length (${classification.length})`);
    }
    console.log("✓ TEST 4 Passed: Score explanation counts deterministically match canonical classification");

    // ── Test 5: Deduplicated Actionable Next Steps ──
    console.log("\n--- TEST 5: Deduplicated Next Steps ---");
    const nextSteps = report.nextSteps || [];
    console.log("Next Steps:", nextSteps);
    const uniqueSteps = new Set(nextSteps.map(s => s.toLowerCase().trim()));
    if (uniqueSteps.size !== nextSteps.length) {
        throw new Error("TEST 5 Failed: Next steps contain duplicate entries");
    }
    console.log("✓ TEST 5 Passed: Next steps are unique and actionable");

    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    server.close();
    await mongoose.disconnect();

    console.log("\n================================================================");
    console.log("ALL CANONICAL CLASSIFICATION QUALITY TESTS PASSED 100%!");
    console.log("================================================================\n");
}

runCanonicalClassificationTest().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
