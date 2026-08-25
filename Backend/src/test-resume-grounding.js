/**
 * Resume Evidence-Grounding Verification Test
 *
 * Tests that the resume generator does NOT inject unsupported JD keywords,
 * does NOT rename projects, does NOT move experience between sections,
 * and does NOT invent metrics.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("./services/ai/genai.client");
const { resumePdfSchema } = require("./services/ai/schemas");
const { buildResumePdfPrompt } = require("./services/ai/prompts/resumePdf.prompt");

const MOCK_RESUME = `
MUHAMMAD SIDDIQ
Contact: msiddiq@email.com | Phone: +92-300-1234567 | GitHub: github.com/msiddiq

EDUCATION
BS Computer Science, FAST-NUCES Lahore (2022 - 2026)

EXPERIENCE
Python Developer Intern — TechSoft Solutions (June 2024 - August 2024)
- Developed Python scripts for automation and debugging
- Practiced OOP concepts, data structures, and algorithms
- Assisted in writing unit tests and code optimization

PROJECTS
SkillBridge — AI-Powered Interview Preparation Platform
- Full-stack web application using React.js, Node.js, Express.js, MongoDB
- Integrated Google Gemini API for AI-driven resume analysis and question generation
- Implemented JWT authentication, REST APIs, and Redis caching
- Used Mongoose ODM for database modeling

AI Security & Attendance System
- Built real-time face detection and recognition using YOLOv8 and OpenCV
- Implemented attendance tracking with SQLite database
- Developed Flask-based web interface for system management

SKILLS
Languages: Python, C++, JavaScript, SQL
Frontend: React.js, HTML, CSS
Backend: Node.js, Express.js, Flask
Databases: MongoDB, SQLite, Redis
Tools: Git, GitHub, Postman, VS Code
APIs: Google Gemini API, REST APIs
Libraries: OpenCV, YOLOv8, Mongoose, NLP
`;

const MOCK_JD = `
AI / ML Intern — Intelligent Automation

Requirements:
- Python, Flask or FastAPI
- Machine Learning, Deep Learning
- RAG (Retrieval-Augmented Generation)
- Vector Databases (Pinecone, Weaviate)
- Docker, Kubernetes
- Prompt Engineering
- Data Analysis
- Model Monitoring and Evaluation
- REST APIs
- Git and GitHub

Responsibilities:
- Design and deploy ML models
- Build RAG pipelines with vector databases
- Implement prompt engineering strategies
- Perform data analysis and feature extraction
- Monitor model performance in production
`;

async function runResumeGroundingTest() {
    console.log("================================================================");
    console.log("RESUME EVIDENCE-GROUNDING VERIFICATION TEST");
    console.log("================================================================\n");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to MongoDB\n");

    const prompt = buildResumePdfPrompt({
        resume: MOCK_RESUME,
        selfDescription: "CS student interested in AI and full-stack development",
        jobDescription: MOCK_JD
    });

    console.log("--- Generating resume via AI (this may take 10-20 seconds) ---");
    const response = await generateJson({
        model: MODELS.PRIMARY,
        contents: prompt,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema)
        }
    });

    const html = response.html;
    console.log(`\n✓ Resume HTML generated (${html.length} chars)\n`);

    // Normalize for case-insensitive matching
    const htmlLower = html.toLowerCase();

    let failures = [];
    let passes = [];

    // ── TEST 1: Unsupported JD keywords MUST NOT appear ──
    console.log("--- TEST 1: Unsupported JD Keywords Must Not Appear ---");
    const unsupportedKeywords = [
        { term: "rag", label: "RAG" },
        { term: "retrieval-augmented", label: "Retrieval-Augmented Generation" },
        { term: "vector database", label: "Vector Databases" },
        { term: "pinecone", label: "Pinecone" },
        { term: "weaviate", label: "Weaviate" },
        { term: "docker", label: "Docker" },
        { term: "kubernetes", label: "Kubernetes" },
        { term: "model monitoring", label: "Model Monitoring" },
        { term: "deep learning", label: "Deep Learning" },
        { term: "fastapi", label: "FastAPI" }
    ];

    for (const kw of unsupportedKeywords) {
        if (htmlLower.includes(kw.term)) {
            failures.push(`FAIL: Unsupported keyword "${kw.label}" found in resume`);
            console.log(`  ✗ "${kw.label}" FOUND (should not be present)`);
        } else {
            passes.push(`PASS: "${kw.label}" correctly excluded`);
            console.log(`  ✓ "${kw.label}" correctly excluded`);
        }
    }

    // ── TEST 2: Supported skills SHOULD appear ──
    console.log("\n--- TEST 2: Supported Skills Should Appear ---");
    const supportedSkills = [
        "python", "javascript", "react", "node.js", "express",
        "mongodb", "flask", "opencv", "yolov8", "git",
        "sql", "redis", "gemini"
    ];

    for (const skill of supportedSkills) {
        if (htmlLower.includes(skill)) {
            passes.push(`PASS: Supported skill "${skill}" present`);
            console.log(`  ✓ "${skill}" present`);
        } else {
            // Not a hard failure — the AI may have worded it differently
            console.log(`  ⚠ "${skill}" not found (may be worded differently)`);
        }
    }

    // ── TEST 3: Project names must be preserved exactly ──
    console.log("\n--- TEST 3: Project Name Integrity ---");
    if (htmlLower.includes("ai security") && htmlLower.includes("attendance")) {
        // Check it wasn't renamed to include "document"
        if (htmlLower.includes("document") && htmlLower.includes("automation system")) {
            failures.push('FAIL: "AI Security & Attendance System" was renamed to include "Document/Automation"');
            console.log('  ✗ Project renamed to include "Document/Automation"');
        } else {
            passes.push('PASS: "AI Security & Attendance System" name preserved');
            console.log('  ✓ "AI Security & Attendance System" name preserved');
        }
    } else {
        console.log('  ⚠ Could not verify project name (may be structured differently)');
    }

    if (htmlLower.includes("skillbridge")) {
        passes.push('PASS: "SkillBridge" project present');
        console.log('  ✓ "SkillBridge" project present');
    }

    // ── TEST 4: No unsupported project claims ──
    console.log("\n--- TEST 4: No Unsupported Project Claims ---");
    const unsupportedClaims = [
        { term: "document processing", label: "document processing" },
        { term: "feature extraction", label: "feature extraction" },
        { term: "model evaluation", label: "model evaluation" },
        { term: "deployment pipeline", label: "deployment pipeline" },
        { term: "prompt engineering", label: "Prompt Engineering" }
    ];

    for (const claim of unsupportedClaims) {
        if (htmlLower.includes(claim.term)) {
            failures.push(`FAIL: Unsupported claim "${claim.label}" injected into resume`);
            console.log(`  ✗ "${claim.label}" FOUND (unsupported)`);
        } else {
            passes.push(`PASS: "${claim.label}" correctly excluded`);
            console.log(`  ✓ "${claim.label}" correctly excluded`);
        }
    }

    // ── TEST 5: Internship integrity — Gemini API not in internship ──
    console.log("\n--- TEST 5: Internship vs Project Integrity ---");
    // Find the internship section and check Gemini API is NOT placed there
    const internshipMatch = htmlLower.match(/techsoft[\s\S]*?(?=<h[23]|<\/section|skillbridge)/i);
    if (internshipMatch) {
        const internSection = internshipMatch[0];
        if (internSection.includes("gemini")) {
            failures.push('FAIL: "Gemini API" was moved into the TechSoft internship');
            console.log('  ✗ "Gemini API" found in TechSoft internship section');
        } else {
            passes.push('PASS: Gemini API correctly kept out of internship');
            console.log('  ✓ Gemini API correctly kept out of internship');
        }

        if (internSection.includes("data analysis")) {
            failures.push('FAIL: "Data Analysis" injected into internship');
            console.log('  ✗ "Data Analysis" found in internship section');
        } else {
            passes.push('PASS: "Data Analysis" not injected into internship');
            console.log('  ✓ "Data Analysis" not injected into internship');
        }
    } else {
        console.log("  ⚠ Could not isolate internship section for analysis");
    }

    // ── TEST 6: No fabricated metrics ──
    console.log("\n--- TEST 6: No Fabricated Metrics ---");
    // Look for suspicious percentage patterns that aren't in the source
    const metricPatterns = [
        /\d{2,3}%\s*(improvement|increase|reduction|faster|accuracy|efficiency)/gi,
        /reduced.*by\s*\d+%/gi,
        /improved.*by\s*\d+%/gi,
        /\d+\+?\s*users/gi,
        /served\s*\d+/gi
    ];

    let foundFakeMetrics = false;
    for (const pattern of metricPatterns) {
        const matches = html.match(pattern);
        if (matches) {
            for (const match of matches) {
                failures.push(`FAIL: Possible fabricated metric: "${match}"`);
                console.log(`  ✗ Possible fabricated metric: "${match}"`);
                foundFakeMetrics = true;
            }
        }
    }
    if (!foundFakeMetrics) {
        passes.push("PASS: No fabricated metrics detected");
        console.log("  ✓ No fabricated metrics detected");
    }

    // ── SUMMARY ──
    console.log("\n================================================================");
    console.log("RESULTS SUMMARY");
    console.log("================================================================");
    console.log(`PASSED: ${passes.length}`);
    console.log(`FAILED: ${failures.length}`);

    if (failures.length > 0) {
        console.log("\nFAILURES:");
        failures.forEach(f => console.log(`  ${f}`));
    }

    console.log("\n================================================================");
    if (failures.length === 0) {
        console.log("ALL RESUME EVIDENCE-GROUNDING TESTS PASSED!");
    } else {
        console.log(`${failures.length} FAILURE(S) DETECTED — REVIEW REQUIRED`);
    }
    console.log("================================================================\n");

    await mongoose.disconnect();
    process.exit(failures.length > 0 ? 1 : 0);
}

runResumeGroundingTest().catch(err => {
    console.error("Test Error:", err);
    process.exit(1);
});
