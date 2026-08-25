/**
 * Monotonic & Parallel-Aware Progress Tracking Test Suite
 */

require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const User = require("./models/user.model");
const Progress = require("./models/progress.model");
const { initProgress, updateStage, updateProgress, getProgress } = require("./services/progress.service");
const { createProgressTracker } = require("./services/ai/utils/progressTracker");
const jwt = require("jsonwebtoken");

async function runMonotonicProgressTests() {
    console.log("================================================================");
    console.log("RUNNING MONOTONIC & PARALLEL-AWARE PROGRESS TEST SUITE");
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
        username: `progress_user_${uniqueSuffix}`,
        email: `progress_${uniqueSuffix}@example.com`,
        password: "TestPassword123!"
    });

    const userToken = jwt.sign(
        { id: testUser._id, username: testUser.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    // ── TEST 1: Technical -> MCQ -> Behavioral -> Skill Gap ──
    console.log("--- TEST 1: Normal Order (Technical -> MCQ -> Behavioral -> Skill Gap) ---");
    let tracker = createProgressTracker(testUser._id);
    await tracker.init();
    await tracker.advance("readingResume", "COMPLETED");
    await tracker.advance("resumeAnalysis", "COMPLETED");

    let p1 = (await getProgress(testUser._id)).progress;
    console.log(`Phase 1 complete: ${p1}% (Expected: 15%)`);
    if (p1 !== 15) throw new Error(`TEST 1 Failed: Expected 15%, got ${p1}%`);

    await tracker.advance("technical", "COMPLETED");
    let p2 = (await getProgress(testUser._id)).progress;
    console.log(`1/4 parallel done: ${p2}% (Expected: 28%)`);
    if (p2 !== 28) throw new Error(`TEST 1 Failed: Expected 28%, got ${p2}%`);

    await tracker.advance("mcq", "COMPLETED");
    let p3 = (await getProgress(testUser._id)).progress;
    console.log(`2/4 parallel done: ${p3}% (Expected: 40%)`);
    if (p3 !== 40) throw new Error(`TEST 1 Failed: Expected 40%, got ${p3}%`);

    await tracker.advance("behavioral", "COMPLETED");
    let p4 = (await getProgress(testUser._id)).progress;
    console.log(`3/4 parallel done: ${p4}% (Expected: 53%)`);
    if (p4 !== 53) throw new Error(`TEST 1 Failed: Expected 53%, got ${p4}%`);

    await tracker.advance("skillGap", "COMPLETED");
    let p5 = (await getProgress(testUser._id)).progress;
    console.log(`4/4 parallel done: ${p5}% (Expected: 65%)`);
    if (p5 !== 65) throw new Error(`TEST 1 Failed: Expected 65%, got ${p5}%`);

    await tracker.advance("roadmap", "IN_PROGRESS");
    await tracker.advance("roadmap", "COMPLETED");
    let p6 = (await getProgress(testUser._id)).progress;
    console.log(`Roadmap done: ${p6}% (Expected: 85%)`);
    if (p6 !== 85) throw new Error(`TEST 1 Failed: Expected 85%, got ${p6}%`);

    await tracker.advance("finalizing", "COMPLETED");
    let p7 = (await getProgress(testUser._id)).progress;
    console.log(`Finalizing done: ${p7}% (Expected: 95%)`);
    if (p7 !== 95) throw new Error(`TEST 1 Failed: Expected 95%, got ${p7}%`);

    await tracker.advance("COMPLETED");
    let p8 = (await getProgress(testUser._id)).progress;
    console.log(`Pipeline complete: ${p8}% (Expected: 100%)`);
    if (p8 !== 100) throw new Error(`TEST 1 Failed: Expected 100%, got ${p8}%`);
    console.log("✓ TEST 1 Passed: Strictly monotonic progression 0 -> 15 -> 28 -> 40 -> 53 -> 65 -> 85 -> 95 -> 100%\n");

    // ── TEST 2: Behavioral -> Technical -> Skill Gap -> MCQ ──
    console.log("--- TEST 2: Out of Order (Behavioral -> Technical -> Skill Gap -> MCQ) ---");
    await tracker.init();
    await tracker.advance("readingResume", "COMPLETED");
    await tracker.advance("resumeAnalysis", "COMPLETED");

    await tracker.advance("behavioral", "COMPLETED");
    let t2_p1 = (await getProgress(testUser._id)).progress;
    console.log(`1/4 parallel (Behavioral first): ${t2_p1}% (Expected: 28%)`);
    if (t2_p1 !== 28) throw new Error(`TEST 2 Failed: Expected 28%, got ${t2_p1}%`);

    await tracker.advance("technical", "COMPLETED");
    let t2_p2 = (await getProgress(testUser._id)).progress;
    console.log(`2/4 parallel (Technical next): ${t2_p2}% (Expected: 40%)`);
    if (t2_p2 !== 40) throw new Error(`TEST 2 Failed: Expected 40%, got ${t2_p2}%`);

    await tracker.advance("skillGap", "COMPLETED");
    let t2_p3 = (await getProgress(testUser._id)).progress;
    console.log(`3/4 parallel (SkillGap next): ${t2_p3}% (Expected: 53%)`);
    if (t2_p3 !== 53) throw new Error(`TEST 2 Failed: Expected 53%, got ${t2_p3}%`);

    await tracker.advance("mcq", "COMPLETED");
    let t2_p4 = (await getProgress(testUser._id)).progress;
    console.log(`4/4 parallel (MCQ last): ${t2_p4}% (Expected: 65%)`);
    if (t2_p4 !== 65) throw new Error(`TEST 2 Failed: Expected 65%, got ${t2_p4}%`);
    console.log("✓ TEST 2 Passed: Reverse completion order remains strictly monotonic\n");

    // ── TEST 3 & 4: Concurrent Parallel Execution & Race Safety ──
    console.log("--- TEST 3 & 4: Concurrent Parallel Execution & Race Safety ---");
    await tracker.init();
    await tracker.advance("readingResume", "COMPLETED");
    await tracker.advance("resumeAnalysis", "COMPLETED");

    // Fire all 4 parallel advances simultaneously
    await Promise.all([
        tracker.advance("skillGap", "COMPLETED"),
        tracker.advance("mcq", "COMPLETED"),
        tracker.advance("technical", "COMPLETED"),
        tracker.advance("behavioral", "COMPLETED")
    ]);

    const concurrentFinal = (await getProgress(testUser._id)).progress;
    console.log(`Concurrent parallel completion result: ${concurrentFinal}% (Expected: 65%)`);
    if (concurrentFinal !== 65) throw new Error(`TEST 4 Failed: Expected 65%, got ${concurrentFinal}%`);
    console.log("✓ TEST 3 & 4 Passed: Concurrent parallel execution resolves safely to 65%\n");

    // ── TEST 5 & 7: Stale Updates Preserved Monotonically ──
    console.log("--- TEST 5 & 7: Stale Update Protection ---");
    await tracker.init();
    await updateProgress(testUser._id, 40, "In Progress");
    await updateProgress(testUser._id, 20, "Stale Update");
    await updateProgress(testUser._id, 50, "Newer Update");

    const staleResult = (await getProgress(testUser._id)).progress;
    console.log(`Progress after [40 -> 20 -> 50]: ${staleResult}% (Expected: 50%)`);
    if (staleResult !== 50) throw new Error(`TEST 5/7 Failed: Expected 50%, got ${staleResult}%`);
    console.log("✓ TEST 5 & 7 Passed: Lower stale updates rejected\n");

    // ── TEST 8: Failure Handling (No Reset to 0) ──
    console.log("--- TEST 8: Failure State Retention ---");
    await tracker.init();
    await tracker.advance("readingResume", "COMPLETED");
    await tracker.advance("resumeAnalysis", "COMPLETED");
    await tracker.advance("technical", "COMPLETED");
    await tracker.advance("mcq", "COMPLETED");

    const preFailProgress = (await getProgress(testUser._id)).progress;
    console.log(`Progress before failure: ${preFailProgress}%`);

    await tracker.fail("behavioral");
    const postFailData = await getProgress(testUser._id);
    console.log(`Progress after failure: ${postFailData.progress}% (Expected: 40%)`);
    console.log(`Status after failure: ${postFailData.status} (Expected: Failed)`);

    if (postFailData.progress !== 40 || postFailData.status !== "Failed") {
        throw new Error(`TEST 8 Failed: Expected 40% with Failed status, got ${postFailData.progress}% / ${postFailData.status}`);
    }
    console.log("✓ TEST 8 Passed: Failure retains last valid progress percentage and does NOT reset to 0%\n");

    // ── TEST 9: HTTP Polling Endpoint Verification ──
    console.log("--- TEST 9: HTTP Polling Endpoint ---");
    const pollRes = await fetch(`${baseUrl}/api/progress`, {
        headers: { "Cookie": `token=${userToken}` }
    });
    const pollData = await pollRes.json();
    console.log(`Polled progress: ${pollData.progress}%, status: ${pollData.status}`);

    if (pollData.progress !== 40 || pollData.status !== "Failed") {
        throw new Error("TEST 9 Failed: HTTP endpoint did not return correct progress");
    }
    console.log("✓ TEST 9 Passed: /api/progress returns accurate monotonic state\n");

    // Cleanup
    await Progress.deleteOne({ user: testUser._id });
    await User.findByIdAndDelete(testUser._id);
    server.close();
    await mongoose.disconnect();

    console.log("================================================================");
    console.log("ALL MONOTONIC & PARALLEL-AWARE PROGRESS TESTS PASSED 100%!");
    console.log("================================================================\n");
}

runMonotonicProgressTests().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
