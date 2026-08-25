/**
 * LaTeX-Style Resume Generation & Page Count Deep Verification Test
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("./services/ai/genai.client");
const { resumePdfSchema } = require("./services/ai/schemas");
const { buildResumePdfPrompt } = require("./services/ai/prompts/resumePdf.prompt");
const { generateResumePdfBuffer, countPdfPages, sanitizeResumeHtml } = require("./services/ai/generators/resumePdfGenerator");

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
- Build, evaluate, and deploy machine learning models.
- Implement RAG (Retrieval-Augmented Generation) pipelines and vector database integrations.
- Develop prompt engineering workflows for LLM applications.
- Build REST APIs with Flask or FastAPI for model serving.
- Containerize services using Docker and orchestrate on Kubernetes.
- Implement document processing and feature extraction workflows.
- Monitor model performance in production.

Requirements:
- Strong programming skills in Python.
- Knowledge of Machine Learning, Computer Vision, and Data Analysis.
- Experience with Generative AI / LLM APIs (Gemini, OpenAI).
- Familiarity with REST APIs, Git, and database systems (SQL / NoSQL).
- Experience with RAG, Vector Databases (Pinecone, ChromaDB), Docker, FastAPI is a plus.
`;

function stripHtmlEntities(str) {
    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

async function runLatexResumeDeepAudit() {
    console.log("================================================================");
    console.log("RUNNING DEEP AUDIT: 1-PAGE LATEX RESUME & STRICT SOURCE GROUNDING");
    console.log("================================================================\n");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to MongoDB");

    console.log("\n--- Step 1: Generating 1-Page LaTeX Resume PDF ---");
    const pdfBuffer = await generateResumePdfBuffer({
        resume: SOURCE_RESUME,
        selfDescription: "Computer Science student with experience in Python, GenAI integrations, and full-stack web development.",
        jobDescription: TARGET_JD
    });

    const outputPath = path.join(__dirname, "test_output_latex_resume.pdf");
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✓ PDF written to ${outputPath} (${pdfBuffer.length} bytes)`);

    // ── Step 2: Page Count Verification ──
    console.log("\n--- Step 2: Verifying Page Count ---");
    const pageCount = await countPdfPages(pdfBuffer);
    console.log(`PDF Page Count: ${pageCount} (Expected: 1)`);

    if (pageCount !== 1) {
        throw new Error(`TEST FAILED: PDF has ${pageCount} pages, expected EXACTLY 1 page!`);
    }
    console.log("✓ EXACTLY 1 PAGE VERIFIED!");

    // ── Step 3: Factual Grounding Deep Audit ──
    console.log("\n--- Step 3: Factual Grounding Deep Audit ---");
    const prompt = buildResumePdfPrompt({
        resume: SOURCE_RESUME,
        selfDescription: "Computer Science student with experience in Python, GenAI integrations, and full-stack web development.",
        jobDescription: TARGET_JD
    });

    const aiResponse = await generateJson({
        model: MODELS.PRIMARY,
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema)
        }
    });

    const rawHtml = aiResponse.html;
    const sanitizedHtml = sanitizeResumeHtml(rawHtml, SOURCE_RESUME, "Computer Science student with experience in Python, GenAI integrations, and full-stack web development.");
    const decodedHtml = stripHtmlEntities(sanitizedHtml).toLowerCase();

    const forbiddenPatterns = [
        { regex: /\b(rag|retrieval[- ]augmented)\b/i, label: "RAG / Retrieval-Augmented" },
        { regex: /\bvector database(s)?\b/i, label: "Vector Databases" },
        { regex: /\bpinecone\b/i, label: "Pinecone" },
        { regex: /\bchromadb\b/i, label: "ChromaDB" },
        { regex: /\bweaviate\b/i, label: "Weaviate" },
        { regex: /\bdocker\b/i, label: "Docker" },
        { regex: /\bkubernetes\b/i, label: "Kubernetes" },
        { regex: /\bfastapi\b/i, label: "FastAPI" },
        { regex: /\bmodel monitoring\b/i, label: "Model Monitoring" },
        { regex: /\baml\/kyc\b/i, label: "AML/KYC" },
        { regex: /\bdocument processing\b/i, label: "Document Processing" },
        { regex: /\bfeature extraction\b/i, label: "Feature Extraction" }
    ];

    let groundFailures = 0;
    for (const pat of forbiddenPatterns) {
        if (pat.regex.test(decodedHtml)) {
            console.log(`  ✗ Unsupported JD keyword found: ${pat.label}`);
            groundFailures++;
        } else {
            console.log(`  ✓ Excluded unsupported: ${pat.label}`);
        }
    }

    if (groundFailures > 0) {
        throw new Error(`TEST FAILED: ${groundFailures} unsupported JD keywords found in resume`);
    }

    // Check project integrity
    if (decodedHtml.includes("ai security & attendance system") || decodedHtml.includes("ai security and attendance system")) {
        console.log("  ✓ Project name 'AI Security & Attendance System' preserved");
    } else {
        throw new Error("TEST FAILED: Project 'AI Security & Attendance System' altered!");
    }

    if (decodedHtml.includes("skillbridge")) {
        console.log("  ✓ Project name 'SkillBridge' preserved");
    } else {
        throw new Error("TEST FAILED: Project 'SkillBridge' missing!");
    }

    // Check styling
    const hasTealColor = sanitizedHtml.includes("#0b4f6c") || sanitizedHtml.includes("#005f73");
    console.log(`\nProfessional Teal Accent Color (#0b4f6c): ${hasTealColor ? "Present" : "Fallback"}`);

    await mongoose.disconnect();

    console.log("\n================================================================");
    console.log("ALL 1-PAGE LATEX RESUME AUDITS PASSED 100%!");
    console.log("================================================================\n");
}

runLatexResumeDeepAudit().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
