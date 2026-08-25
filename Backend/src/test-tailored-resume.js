process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { generateResumePdfBuffer, countPdfPages, sanitizeResumeHtml } = require("./services/ai/generators/resumePdfGenerator");
const { buildResumePdfPrompt } = require("./services/ai/prompts/resumePdf.prompt");
const { generateJson, MODELS } = require("./services/ai/genai.client");
const { resumePdfSchema } = require("./services/ai/schemas");
const { zodToJsonSchema } = require("zod-to-json-schema");
const pdfParse = require("pdf-parse");

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

async function runTailoredResumeVerification() {
    console.log("================================================================");
    console.log("RUNNING TAILORED RESUME QUALITY & GROUNDING VERIFICATION");
    console.log("================================================================\n");

    console.log("--- Generating Tailored Resume PDF Buffer ---");
    const pdfBuffer = await generateResumePdfBuffer({
        resume: SOURCE_RESUME,
        selfDescription: "Computer Science student with experience in Python, GenAI integrations, and full-stack web development.",
        jobDescription: TARGET_JD
    });

    const outputPath = path.join(__dirname, "test_output_tailored_resume.pdf");
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✓ PDF written to ${outputPath} (${pdfBuffer.length} bytes)`);

    // 1. Page count check
    const pageCount = await countPdfPages(pdfBuffer);
    console.log(`PDF Page Count: ${pageCount} (Expected: 1)`);

    // 2. Extract text from PDF to verify tailoring
    const parser = new pdfParse.PDFParse(Uint8Array.from(pdfBuffer));
    const parsed = await parser.getText();
    const pdfText = parsed.text;

    console.log("\n================ EXTRACTED RESUME TEXT ================");
    console.log(pdfText);
    console.log("=======================================================\n");

    // Check unsupported keywords are NOT in text
    const banned = ["RAG", "Vector Database", "Pinecone", "ChromaDB", "Docker", "Kubernetes", "FastAPI", "AML/KYC"];
    const foundBanned = banned.filter(b => new RegExp(`\\b${b}\\b`, "i").test(pdfText));
    console.log(`Banned Keywords Found: ${foundBanned.length > 0 ? foundBanned.join(", ") : "NONE (✓ PASS)"}`);

    // Check project name integrity
    const hasCorrectProjectName = pdfText.includes("AI Security & Attendance System");
    console.log(`Correct Project Name Preserved: ${hasCorrectProjectName ? "YES (✓ PASS)" : "NO"}`);

    // Check verified AI technologies are highlighted
    const hasGemini = /Gemini/i.test(pdfText);
    const hasYolo = /YOLOv8/i.test(pdfText);
    const hasPython = /Python/i.test(pdfText);
    console.log(`Verified Technologies: Gemini=${hasGemini}, YOLOv8=${hasYolo}, Python=${hasPython}`);

    if (pageCount !== 1) {
        throw new Error(`Failed: Expected 1 page, got ${pageCount}`);
    }
    if (foundBanned.length > 0) {
        throw new Error(`Failed: Banned keywords found: ${foundBanned.join(", ")}`);
    }

    console.log("\n✓ ALL TAILORED RESUME CHECKS PASSED!");
}

runTailoredResumeVerification().catch(err => {
    console.error("Test Error:", err);
    process.exit(1);
});
