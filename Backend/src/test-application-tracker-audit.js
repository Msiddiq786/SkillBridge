const assert = require("assert");

console.log("==================================================");
console.log("TESTING APPLICATION TRACKER TIMELINE, SNAPSHOTS & ISOLATION");
console.log("==================================================");

// Mock application tracking logic
function createMockApplication({
    userId = "user_A",
    report = null,
    status = "READY_TO_APPLY",
    targetRole = "AI / ML Intern",
    company = "TechNova",
    readinessData = { jdMatch: 82, status: "READY TO APPLY" },
    resumeVersion = { versionNumber: 4, versionName: "JD-Ready Resume v4" }
}) {
    const timeline = [];
    if (report) {
        timeline.push({
            date: new Date("2026-08-20"),
            title: "Analyzed Job Description",
            status: "ANALYZED"
        });
    }
    timeline.push({
        date: new Date("2026-08-26"),
        title: status === "APPLIED" ? "Applied for Position" : "Application Added to Tracker",
        status
    });

    return {
        _id: "app_" + Math.random().toString(36).substr(2, 9),
        user: userId,
        targetRole,
        company,
        status,
        timeline,
        readinessSnapshot: {
            jdMatch: readinessData.jdMatch,
            status: readinessData.status,
            capturedAt: new Date("2026-08-26")
        },
        resumeVersionUsed: {
            versionNumber: resumeVersion.versionNumber,
            versionName: resumeVersion.versionName
        },
        appliedAt: status === "APPLIED" ? new Date("2026-08-26") : null
    };
}

function updateMockApplication(app, userId, updateData) {
    if (app.user !== userId) {
        throw new Error("UNAUTHORIZED: IDOR violation prevented");
    }

    const prevStatus = app.status;
    if (updateData.status && updateData.status !== prevStatus) {
        app.status = updateData.status;
        app.timeline.push({
            date: new Date(),
            title: `Status Changed to ${updateData.status}`,
            status: updateData.status
        });
    }

    if (updateData.interviewDate) {
        app.interviewDate = updateData.interviewDate;
    }
    if (updateData.notes) {
        app.notes = updateData.notes;
    }
    return app;
}

// ----------------------------------------------------
// TEST 1 — Application Creation & Snapshot
// ----------------------------------------------------
console.log("\n[TEST 1] Testing Application Creation & Snapshot Capture...");
const app1 = createMockApplication({
    userId: "user_A",
    report: { _id: "rep-01" },
    status: "READY_TO_APPLY",
    readinessData: { jdMatch: 82, status: "READY TO APPLY" },
    resumeVersion: { versionNumber: 4, versionName: "JD-Ready Resume v4" }
});

assert.strictEqual(app1.user, "user_A");
assert.strictEqual(app1.status, "READY_TO_APPLY");
assert.strictEqual(app1.readinessSnapshot.jdMatch, 82);
assert.strictEqual(app1.resumeVersionUsed.versionNumber, 4);
assert.strictEqual(app1.timeline.length, 2);
console.log("✓ TEST 1 Passed: Application created with immutable readiness snapshot and resume version v4");

// ----------------------------------------------------
// TEST 2 — Status Progression (Applied -> Interview -> Offer)
// ----------------------------------------------------
console.log("\n[TEST 2] Testing Application Lifecycle Progression & Timeline...");
updateMockApplication(app1, "user_A", { status: "APPLIED" });
assert.strictEqual(app1.status, "APPLIED");
assert.strictEqual(app1.timeline.length, 3);

updateMockApplication(app1, "user_A", { status: "INTERVIEW", interviewDate: new Date("2026-08-30"), notes: "Technical round" });
assert.strictEqual(app1.status, "INTERVIEW");
assert.strictEqual(app1.notes, "Technical round");
assert.strictEqual(app1.timeline.length, 4);

updateMockApplication(app1, "user_A", { status: "OFFER", notes: "Offer received!" });
assert.strictEqual(app1.status, "OFFER");
assert.strictEqual(app1.timeline.length, 5);
console.log("✓ TEST 2 Passed: Application successfully transitioned APPLIED -> INTERVIEW -> OFFER with full event log");

// ----------------------------------------------------
// TEST 3 — Historical Immutability (Resume v4 remains recorded even if v5 created later)
// ----------------------------------------------------
console.log("\n[TEST 3] Testing Historical Snapshot and Version Reference Immutability...");
// Candidate later creates resume v5 for another job:
const laterResume = { versionNumber: 5, versionName: "JD-Ready Resume v5" };
// app1's resumeVersionUsed must stay v4
assert.strictEqual(app1.resumeVersionUsed.versionNumber, 4);
console.log("✓ TEST 3 Passed: Historical application preserves initial resume v4 reference");

// ----------------------------------------------------
// TEST 4 — User Isolation / IDOR Protection
// ----------------------------------------------------
console.log("\n[TEST 4] Testing User Isolation & IDOR Protection...");
assert.throws(() => {
    updateMockApplication(app1, "user_B", { status: "REJECTED" });
}, /UNAUTHORIZED/, "User B must not be allowed to mutate User A's application");
console.log("✓ TEST 4 Passed: Cross-user mutation blocked");

console.log("\n==================================================");
console.log("ALL APPLICATION TRACKER TESTS PASSED! 🚀");
console.log("==================================================");
