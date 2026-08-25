require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("./app");
const User = require("./models/user.model");
const InterviewReport = require("./models/interviewReport.model");
const PracticeSession = require("./models/practiceSession.model");

async function testHttpEndpoints() {
    console.log("================================================================");
    console.log("TESTING ALL /api/practice/* HTTP ENDPOINTS OVER REAL SERVER");
    console.log("================================================================");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to Database");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✓ Test HTTP server listening on ${baseUrl}`);

    // Setup Test User
    let user = await User.findOne({ email: "route_test_user@test.com" });
    if (!user) {
        user = await User.create({
            username: "RouteTester",
            email: "route_test_user@test.com",
            password: "hashedpassword123"
        });
    }

    // JWT token format matching auth.controller.js exactly: { id: user._id, username: user.username }
    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    const cookieHeader = `token=${token}`;

    // Setup Test Report
    let report = await InterviewReport.findOne({ user: user._id });
    if (!report) {
        report = await InterviewReport.create({
            user: user._id,
            title: "Frontend & AI Engineer",
            jobDescription: "React, Node.js, and Google Gemini API experience required.",
            resume: "React, JavaScript, TypeScript, Node.js.",
            matchScore: 85,
            technicalQuestions: [
                {
                    difficulty: "Easy",
                    category: "React",
                    question: "What is the Virtual DOM in React?",
                    intention: "Checks React core architecture",
                    oneLineAnswer: "An in-memory lightweight representation of the real DOM.",
                    simpleExplanation: "React updates the virtual DOM first, compares it using diffing, and batches real DOM updates."
                }
            ],
            mcqQuestions: [
                {
                    difficulty: "Easy",
                    category: "JavaScript",
                    question: "Which keyword declares a block-scoped variable?",
                    options: ["var", "let", "function", "global"],
                    correctAnswer: "let",
                    explanation: "let and const provide block scoping."
                }
            ],
            behavioralQuestions: [
                {
                    difficulty: "Easy",
                    question: "Tell me about a time you met a tight deadline.",
                    intention: "Time management",
                    situation: "We had 2 weeks for a project launch.",
                    task: "Deliver MVP without compromising quality.",
                    action: "Prioritized essential features and held daily standups.",
                    result: "Delivered on schedule with positive feedback."
                }
            ],
            preparationPlan: [
                {
                    day: 1,
                    focus: "React & Virtual DOM",
                    tasks: ["Understand reconciliation", "Diffing algorithm"],
                    difficulty: "Easy"
                }
            ]
        });
    }

    // Clean previous test sessions
    await PracticeSession.deleteMany({ user: user._id });

    // ── 1. TEST POST /api/practice/start ──
    console.log("\n1. Testing POST /api/practice/start ...");
    const startRes = await fetch(`${baseUrl}/api/practice/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": cookieHeader },
        body: JSON.stringify({ interviewReportId: report._id.toString(), mode: "technical" })
    });
    console.log(`Status: ${startRes.status} (Expected: 200)`);
    const startData = await startRes.json();
    if (startRes.status !== 200 || !startData.session?._id) {
        throw new Error(`POST /api/practice/start failed: ${JSON.stringify(startData)}`);
    }
    const sessionId = startData.session._id;
    console.log(`✓ Session initialized: ${sessionId}`);

    // ── 2. TEST GET /api/practice/:id ──
    console.log("\n2. Testing GET /api/practice/:id ...");
    const getRes = await fetch(`${baseUrl}/api/practice/${sessionId}`, {
        headers: { "Cookie": cookieHeader }
    });
    console.log(`Status: ${getRes.status} (Expected: 200)`);
    const getData = await getRes.json();
    if (getRes.status !== 200 || getData.session._id !== sessionId) {
        throw new Error(`GET /api/practice/:id failed: ${JSON.stringify(getData)}`);
    }
    console.log(`✓ Session retrieved: Mode = ${getData.session.mode}`);

    // ── 3. TEST PATCH /api/practice/:id/progress ──
    console.log("\n3. Testing PATCH /api/practice/:id/progress ...");
    const patchRes = await fetch(`${baseUrl}/api/practice/${sessionId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cookie": cookieHeader },
        body: JSON.stringify({
            progressData: { technicalProgress: { currentIndex: 1, answered: 1 } },
            timeSpentDelta: 30
        })
    });
    console.log(`Status: ${patchRes.status} (Expected: 200)`);
    const patchData = await patchRes.json();
    if (patchRes.status !== 200 || patchData.session.timeSpentSeconds !== 30) {
        throw new Error(`PATCH /api/practice/:id/progress failed: ${JSON.stringify(patchData)}`);
    }
    console.log(`✓ Progress updated: timeSpent = ${patchData.session.timeSpentSeconds}s`);

    // ── 4. TEST POST /api/practice/:id/answer ──
    console.log("\n4. Testing POST /api/practice/:id/answer ...");
    const answerRes = await fetch(`${baseUrl}/api/practice/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": cookieHeader },
        body: JSON.stringify({
            questionIndex: 0,
            questionType: "technical",
            questionText: "What is the Virtual DOM?",
            category: "React",
            confidence: "KNOWN",
            timeSpentSeconds: 15
        })
    });
    console.log(`Status: ${answerRes.status} (Expected: 200)`);
    const answerData = await answerRes.json();
    if (answerRes.status !== 200 || answerData.session.answers.length === 0) {
        throw new Error(`POST /api/practice/:id/answer failed: ${JSON.stringify(answerData)}`);
    }
    console.log(`✓ Answer saved (Total answers: ${answerData.session.answers.length})`);

    // ── 5. TEST POST /api/practice/evaluate ──
    console.log("\n5. Testing POST /api/practice/evaluate ...");
    const evalRes = await fetch(`${baseUrl}/api/practice/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cookie": cookieHeader },
        body: JSON.stringify({
            questionType: "technical",
            questionData: report.technicalQuestions[0],
            userAnswer: "Virtual DOM is a virtual representation of the UI kept in memory and synced with real DOM by React."
        })
    });
    console.log(`Status: ${evalRes.status} (Expected: 200)`);
    const evalData = await evalRes.json();
    if (evalRes.status !== 200 || !evalData.evaluation?.score) {
        throw new Error(`POST /api/practice/evaluate failed: ${JSON.stringify(evalData)}`);
    }
    console.log(`✓ AI Evaluator returned score: ${evalData.evaluation.score}%`);

    // ── 6. TEST POST /api/practice/:id/complete ──
    console.log("\n6. Testing POST /api/practice/:id/complete ...");
    const compRes = await fetch(`${baseUrl}/api/practice/${sessionId}/complete`, {
        method: "POST",
        headers: { "Cookie": cookieHeader }
    });
    console.log(`Status: ${compRes.status} (Expected: 200)`);
    const compData = await compRes.json();
    if (compRes.status !== 200 || compData.session.status !== "COMPLETED") {
        throw new Error(`POST /api/practice/:id/complete failed: ${JSON.stringify(compData)}`);
    }
    console.log(`✓ Session completed. Overall Readiness: ${compData.session.overallScore}%`);

    // ── 7. TEST GET /api/practice/:id/results ──
    console.log("\n7. Testing GET /api/practice/:id/results ...");
    const resRes = await fetch(`${baseUrl}/api/practice/${sessionId}/results`, {
        headers: { "Cookie": cookieHeader }
    });
    console.log(`Status: ${resRes.status} (Expected: 200)`);
    const resData = await resRes.json();
    if (resRes.status !== 200 || resData.overallScore === undefined) {
        throw new Error(`GET /api/practice/:id/results failed: ${JSON.stringify(resData)}`);
    }
    console.log(`✓ Results retrieved: Score = ${resData.overallScore}%`);

    // ── 8. TEST GET /api/practice/stats ──
    console.log("\n8. Testing GET /api/practice/stats ...");
    const statsRes = await fetch(`${baseUrl}/api/practice/stats`, {
        headers: { "Cookie": cookieHeader }
    });
    console.log(`Status: ${statsRes.status} (Expected: 200)`);
    const statsData = await statsRes.json();
    if (statsRes.status !== 200 || !statsData.stats) {
        throw new Error(`GET /api/practice/stats failed: ${JSON.stringify(statsData)}`);
    }
    console.log(`✓ User stats retrieved: Total sessions = ${statsData.stats.totalSessions}, Readiness = ${statsData.stats.averageReadiness}%`);

    server.close();
    await mongoose.disconnect();

    console.log("\n================================================================");
    console.log("ALL /api/practice/* ROUTES ARE 100% OPERATIONAL OVER HTTP!");
    console.log("================================================================");
}

testHttpEndpoints().catch(err => {
    console.error("HTTP Route Test Error:", err);
    process.exit(1);
});
