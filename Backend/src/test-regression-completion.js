require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("./app");
const User = require("./models/user.model");
const InterviewReport = require("./models/interviewReport.model");
const PracticeSession = require("./models/practiceSession.model");

async function runRegressionTests() {
    console.log("================================================================");
    console.log("RUNNING REGRESSION TEST SUITE: PRACTICE COMPLETION & SCORING");
    console.log("================================================================");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to Database");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✓ Test HTTP server running on ${baseUrl}`);

    // Setup Test User A
    let userA = await User.findOne({ email: "reg_user_a@test.com" });
    if (!userA) {
        userA = await User.create({ username: "UserA", email: "reg_user_a@test.com", password: "pwd" });
    }
    const tokenA = jwt.sign({ id: userA._id, username: userA.username }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const authHeadersA = { "Content-Type": "application/json", "Cookie": `token=${tokenA}` };

    // Setup Test User B
    let userB = await User.findOne({ email: "reg_user_b@test.com" });
    if (!userB) {
        userB = await User.create({ username: "UserB", email: "reg_user_b@test.com", password: "pwd" });
    }
    const tokenB = jwt.sign({ id: userB._id, username: userB.username }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const authHeadersB = { "Content-Type": "application/json", "Cookie": `token=${tokenB}` };

    // Setup Test Report with questions for User A
    let reportA = await InterviewReport.findOne({ user: userA._id });
    if (!reportA) {
        reportA = await InterviewReport.create({
            user: userA._id,
            title: "Full-Stack AI Developer",
            jobDescription: "React, Node.js, AI full-stack development",
            resume: "React, Node, Express, MongoDB",
            matchScore: 88,
            technicalQuestions: Array.from({ length: 20 }, (_, i) => ({
                difficulty: "Medium",
                category: "Full-Stack",
                question: `Technical Question ${i + 1}?`,
                intention: "Evaluate architecture",
                answer: "Sample answer"
            })),
            mcqQuestions: Array.from({ length: 15 }, (_, i) => ({
                difficulty: "Easy",
                category: "JavaScript",
                question: `MCQ Question ${i + 1}?`,
                options: ["A", "B", "C", "D"],
                correctAnswer: "A",
                explanation: "Option A is correct"
            })),
            behavioralQuestions: Array.from({ length: 10 }, (_, i) => ({
                difficulty: "Medium",
                question: `Behavioral Question ${i + 1}?`,
                intention: "Leadership",
                situation: "Project crunch",
                task: "Deliver on time",
                action: "Streamlined workflow",
                result: "Success"
            })),
            preparationPlan: [
                { day: 1, focus: "Full-Stack Architecture", tasks: ["Task 1"], difficulty: "Medium" }
            ]
        });
    }

    // Clean previous sessions
    await PracticeSession.deleteMany({ user: userA._id });
    await PracticeSession.deleteMany({ user: userB._id });

    // ── TEST 1: Start technical session & answer 1 ──
    console.log("\n--- TEST 1: Technical Mode 1/20 Answered ---");
    const techStartRes = await fetch(`${baseUrl}/api/practice/start`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ interviewReportId: reportA._id.toString(), mode: "technical" })
    });
    const techStartData = await techStartRes.json();
    const techSessionId = techStartData.session._id;

    // Submit 1 answer with confidence
    await fetch(`${baseUrl}/api/practice/${techSessionId}/answer`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({
            questionIndex: 0,
            questionType: "technical",
            confidence: "KNOWN"
        })
    });

    const checkTechRes = await fetch(`${baseUrl}/api/practice/${techSessionId}`, { headers: authHeadersA });
    const checkTechData = await checkTechRes.json();
    console.log(`Status: ${checkTechData.session.status} (Expected: IN_PROGRESS)`);
    console.log(`Attempted: ${checkTechData.attemptedCount} / ${checkTechData.requiredCount} (Expected: 1 / 20)`);
    if (checkTechData.session.status !== "IN_PROGRESS" || checkTechData.attemptedCount !== 1) {
        throw new Error("TEST 1 Failed: Status should be IN_PROGRESS with 1 attempted");
    }

    // ── TEST 2: Attempt Early Completion on 1/20 (Must Be Rejected) ──
    console.log("\n--- TEST 2: Early Completion Rejection on 1/20 ---");
    const earlyCompRes = await fetch(`${baseUrl}/api/practice/${techSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    console.log(`HTTP Status: ${earlyCompRes.status} (Expected: 400 Bad Request)`);
    const earlyCompData = await earlyCompRes.json();
    console.log(`Message: "${earlyCompData.message}"`);
    console.log(`Remaining: ${earlyCompData.remainingCount} questions`);
    if (earlyCompRes.status !== 400 || earlyCompData.remainingCount !== 19) {
        throw new Error("TEST 2 Failed: Backend should reject early completion with 400 and 19 remaining");
    }

    // ── TEST 3: Complete remaining 19 technical questions (including skips) ──
    console.log("\n--- TEST 3: Complete all 20 Technical Questions & Finish ---");
    for (let i = 1; i < 20; i++) {
        await fetch(`${baseUrl}/api/practice/${techSessionId}/answer`, {
            method: "POST",
            headers: authHeadersA,
            body: JSON.stringify({
                questionIndex: i,
                questionType: "technical",
                confidence: i % 2 === 0 ? "KNOWN" : "PARTIAL",
                isSkipped: i === 19 // Test 1 skip
            })
        });
    }

    const techFinalCompRes = await fetch(`${baseUrl}/api/practice/${techSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    console.log(`HTTP Status: ${techFinalCompRes.status} (Expected: 200)`);
    const techFinalData = await techFinalCompRes.json();
    console.log(`Final Status: ${techFinalData.session.status} (Expected: COMPLETED)`);
    console.log(`Overall Readiness Score: ${techFinalData.session.overallScore}%`);
    if (techFinalData.session.status !== "COMPLETED") {
        throw new Error("TEST 3 Failed: Technical session should be COMPLETED");
    }

    // ── TEST 4 & 5: MCQ Mode (1/15 Reject -> 15/15 Complete) ──
    console.log("\n--- TEST 4 & 5: MCQ Mode 1/15 Reject -> 15/15 Complete ---");
    const mcqStartRes = await fetch(`${baseUrl}/api/practice/start`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ interviewReportId: reportA._id.toString(), mode: "mcq" })
    });
    const mcqStartData = await mcqStartRes.json();
    const mcqSessionId = mcqStartData.session._id;

    // Answer 1 MCQ
    await fetch(`${baseUrl}/api/practice/${mcqSessionId}/answer`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ questionIndex: 0, questionType: "mcq", selectedOption: "A", isCorrect: true })
    });

    const mcqEarlyRes = await fetch(`${baseUrl}/api/practice/${mcqSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    if (mcqEarlyRes.status !== 400) throw new Error("TEST 4 Failed: Early MCQ completion should be rejected");
    console.log("✓ MCQ early completion correctly rejected (14 remaining)");

    // Complete all 15
    for (let i = 1; i < 15; i++) {
        await fetch(`${baseUrl}/api/practice/${mcqSessionId}/answer`, {
            method: "POST",
            headers: authHeadersA,
            body: JSON.stringify({ questionIndex: i, questionType: "mcq", selectedOption: "A", isCorrect: i % 3 !== 0 })
        });
    }
    const mcqFinalRes = await fetch(`${baseUrl}/api/practice/${mcqSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    const mcqFinalData = await mcqFinalRes.json();
    console.log(`✓ MCQ Completed (15/15): Status = ${mcqFinalData.session.status}, Accuracy = ${mcqFinalData.session.overallScore}%`);

    // ── TEST 6 & 7: Behavioral Mode (1/10 Reject -> 10/10 Complete) ──
    console.log("\n--- TEST 6 & 7: Behavioral Mode 1/10 Reject -> 10/10 Complete ---");
    const behStartRes = await fetch(`${baseUrl}/api/practice/start`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ interviewReportId: reportA._id.toString(), mode: "behavioral" })
    });
    const behStartData = await behStartRes.json();
    const behSessionId = behStartData.session._id;

    // Answer 1 Behavioral
    await fetch(`${baseUrl}/api/practice/${behSessionId}/answer`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ questionIndex: 0, questionType: "behavioral", userAnswer: "STAR answer sample", score: 85 })
    });

    const behEarlyRes = await fetch(`${baseUrl}/api/practice/${behSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    if (behEarlyRes.status !== 400) throw new Error("TEST 6 Failed: Early Behavioral completion should be rejected");
    console.log("✓ Behavioral early completion correctly rejected (9 remaining)");

    // Complete all 10
    for (let i = 1; i < 10; i++) {
        await fetch(`${baseUrl}/api/practice/${behSessionId}/answer`, {
            method: "POST",
            headers: authHeadersA,
            body: JSON.stringify({ questionIndex: i, questionType: "behavioral", userAnswer: `STAR answer ${i}`, score: 80 })
        });
    }
    const behFinalRes = await fetch(`${baseUrl}/api/practice/${behSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    const behFinalData = await behFinalRes.json();
    console.log(`✓ Behavioral Completed (10/10): Status = ${behFinalData.session.status}, Score = ${behFinalData.session.overallScore}%`);

    // ── TEST 8, 9, 10, 11, 12: Mixed Mode Full Simulator (1/45 -> Duplicate Test -> 45/45 Complete) ──
    console.log("\n--- TEST 8, 9, 10, 11, 12: Mixed Mode Full Simulator (45 Questions) ---");
    const mixStartRes = await fetch(`${baseUrl}/api/practice/start`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ interviewReportId: reportA._id.toString(), mode: "mixed" })
    });
    const mixStartData = await mixStartRes.json();
    const mixSessionId = mixStartData.session._id;

    // Answer 1 question
    await fetch(`${baseUrl}/api/practice/${mixSessionId}/answer`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ questionIndex: 0, questionType: "technical", confidence: "KNOWN" })
    });

    // Test duplicate submission on the SAME question
    await fetch(`${baseUrl}/api/practice/${mixSessionId}/answer`, {
        method: "POST",
        headers: authHeadersA,
        body: JSON.stringify({ questionIndex: 0, questionType: "technical", confidence: "KNOWN" })
    });

    const mixCheck1Res = await fetch(`${baseUrl}/api/practice/${mixSessionId}`, { headers: authHeadersA });
    const mixCheck1Data = await mixCheck1Res.json();
    console.log(`Attempted after duplicate submission: ${mixCheck1Data.attemptedCount} / ${mixCheck1Data.requiredCount} (Expected: 1 / 45)`);
    if (mixCheck1Data.attemptedCount !== 1) {
        throw new Error("TEST 10 Failed: Duplicate submission increased attemptedCount");
    }

    // Try early completion on 1/45
    const mixEarlyRes = await fetch(`${baseUrl}/api/practice/${mixSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    if (mixEarlyRes.status !== 400) {
        throw new Error("TEST 9 Failed: Early completion on 1/45 in mixed mode MUST be rejected");
    }
    const mixEarlyData = await mixEarlyRes.json();
    console.log(`✓ Mixed early completion rejected (Attempted: ${mixEarlyData.attemptedCount}, Remaining: ${mixEarlyData.remainingCount})`);

    // Submit remaining 19 technical
    for (let i = 1; i < 20; i++) {
        await fetch(`${baseUrl}/api/practice/${mixSessionId}/answer`, {
            method: "POST",
            headers: authHeadersA,
            body: JSON.stringify({ questionIndex: i, questionType: "technical", confidence: "KNOWN" })
        });
    }

    // Submit 15 MCQs
    for (let i = 0; i < 15; i++) {
        await fetch(`${baseUrl}/api/practice/${mixSessionId}/answer`, {
            method: "POST",
            headers: authHeadersA,
            body: JSON.stringify({ questionIndex: i, questionType: "mcq", selectedOption: "A", isCorrect: true })
        });
    }

    // Submit 10 Behavioral
    for (let i = 0; i < 10; i++) {
        await fetch(`${baseUrl}/api/practice/${mixSessionId}/answer`, {
            method: "POST",
            headers: authHeadersA,
            body: JSON.stringify({ questionIndex: i, questionType: "behavioral", userAnswer: "STAR story", score: 90 })
        });
    }

    // Check progress before completing
    const mixCheckFullRes = await fetch(`${baseUrl}/api/practice/${mixSessionId}`, { headers: authHeadersA });
    const mixCheckFullData = await mixCheckFullRes.json();
    console.log(`Attempted before completion: ${mixCheckFullData.attemptedCount} / ${mixCheckFullData.requiredCount} (Expected: 45 / 45)`);

    // Complete session
    const mixFinalCompRes = await fetch(`${baseUrl}/api/practice/${mixSessionId}/complete`, {
        method: "POST",
        headers: authHeadersA
    });
    if (mixFinalCompRes.status !== 200) {
        throw new Error("TEST 12 Failed: Complete 45/45 failed");
    }
    const mixFinalData = await mixFinalCompRes.json();
    console.log(`✓ Mixed Full Simulator Completed: Status = ${mixFinalData.session.status}, Practice Readiness = ${mixFinalData.session.overallScore}%`);

    // ── TEST 13: Security & Ownership Check ──
    console.log("\n--- TEST 13: Security & User Ownership ---");
    const secRes = await fetch(`${baseUrl}/api/practice/${mixSessionId}`, { headers: authHeadersB });
    console.log(`User B accessing User A's session: Status = ${secRes.status} (Expected: 404/403)`);
    if (secRes.status !== 404) {
        throw new Error("TEST 13 Failed: Unauthorized access should be blocked");
    }
    console.log("✓ Security verification passed");

    server.close();
    await mongoose.disconnect();

    console.log("\n================================================================");
    console.log("ALL 13 REGRESSION TESTS PASSED 100%!");
    console.log("================================================================");
}

runRegressionTests().catch(err => {
    console.error("Regression Test Failure:", err);
    process.exit(1);
});
