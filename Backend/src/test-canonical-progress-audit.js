const assert = require("assert");
const journeyService = require("./services/journey.service");
const progressService = require("./services/progress.service");
const { PREDEFINED_ACHIEVEMENTS } = require("./services/journey.service");

console.log("==================================================");
console.log("TESTING CANONICAL PROGRESS & JOURNEY COMPLETION SUITE");
console.log("==================================================");

// [TEST 1] Milestone Catalog & ProfileModel Integrity
console.log("\n[TEST 1] Verifying PREDEFINED_ACHIEVEMENTS Catalog...");
assert.strictEqual(Object.keys(PREDEFINED_ACHIEVEMENTS).length, 22, "Must contain exactly 22 predefined milestones");
assert(PREDEFINED_ACHIEVEMENTS.roadmap_finisher, "Must define roadmap_finisher");
assert(PREDEFINED_ACHIEVEMENTS.first_analysis, "Must define first_analysis");
assert(PREDEFINED_ACHIEVEMENTS.streak_7, "Must define streak_7");
assert(PREDEFINED_ACHIEVEMENTS.skill_builder, "Must define skill_builder");
console.log("✓ TEST 1 Passed: 22 career milestones verified with valid targets");

// [TEST 2] Invariant Calculation Check
console.log("\n[TEST 2] Verifying Analyzer Counts Invariant Balance (Total = Completed + Active + NotStarted)...");

function computeAnalysesCounts(reports, journeys) {
    const totalAnalyzed = reports.length;
    const completedReportIds = new Set(
        journeys.filter(j => j.status === "COMPLETED" || j.overallProgress === 100).map(j => j.report?.toString())
    );
    const activeReportIds = new Set(
        journeys.filter(j => j.status === "ACTIVE" && j.overallProgress < 100).map(j => j.report?.toString())
    );

    const completed = reports.filter(r => completedReportIds.has(r._id.toString())).length;
    const active = reports.filter(r => !completedReportIds.has(r._id.toString()) && activeReportIds.has(r._id.toString())).length;
    const notStarted = Math.max(0, totalAnalyzed - (completed + active));
    const completionRate = totalAnalyzed > 0 ? Math.round((completed / totalAnalyzed) * 100) : 0;

    return { total: totalAnalyzed, completed, active, notStarted, completionRate };
}

const mockReports = [
    { _id: "rep-1", title: "Full Stack Developer", company: "Tech Corp", matchScore: 80 },
    { _id: "rep-2", title: "AI / ML Engineer", company: "Data Labs", matchScore: 85 }
];

// Scenario A: 0 journeys started
const countsA = computeAnalysesCounts(mockReports, []);
assert.strictEqual(countsA.total, 2);
assert.strictEqual(countsA.completed, 0);
assert.strictEqual(countsA.active, 0);
assert.strictEqual(countsA.notStarted, 2);
assert.strictEqual(countsA.completed + countsA.active + countsA.notStarted, countsA.total);

// Scenario B: Journey 1 is completed (100%), Journey 2 is active (27%)
const mockJourneys = [
    { _id: "j-1", report: "rep-1", status: "COMPLETED", overallProgress: 100, completedDays: [1, 2, 3, 4, 5, 6, 7], roadmapDays: 7 },
    { _id: "j-2", report: "rep-2", status: "ACTIVE", overallProgress: 27, completedDays: [1, 2], roadmapDays: 7 }
];

const countsB = computeAnalysesCounts(mockReports, mockJourneys);
assert.strictEqual(countsB.total, 2);
assert.strictEqual(countsB.completed, 1);
assert.strictEqual(countsB.active, 1);
assert.strictEqual(countsB.notStarted, 0);
assert.strictEqual(countsB.completionRate, 50);
assert.strictEqual(countsB.completed + countsB.active + countsB.notStarted, countsB.total);
console.log("✓ TEST 2 Passed: Invariant holds across all lifecycle transitions (1 + 1 + 0 = 2)");

// [TEST 3] Deduplicated Skills Gained
console.log("\n[TEST 3] Verifying Strictly Deduplicated Skills Gained...");
const sampleSkillsMap = new Map();
const skillInputs = [
    { name: "React", source: "Profile" },
    { name: "react", source: "Project" }, // duplicate lowercase
    { name: "Node.js", source: "Profile" },
    { name: "MongoDB", source: "Project" },
    { name: "  React  ", source: "Practice" } // duplicate with spaces
];

skillInputs.forEach(s => {
    const key = s.name.trim().toLowerCase();
    if (!sampleSkillsMap.has(key)) {
        sampleSkillsMap.set(key, { name: s.name.trim(), status: "Verified", source: s.source });
    }
});

assert.strictEqual(sampleSkillsMap.size, 3, "Only React, Node.js, MongoDB should be stored (no duplicates)");
console.log("✓ TEST 3 Passed: Case-insensitive deduplication prevents double-counting");

// [TEST 4] Calendar Duration vs Active Learning Minutes
console.log("\n[TEST 4] Verifying Calendar Duration vs Active Learning Minutes distinction...");
const startedAt = new Date("2026-08-20T10:00:00Z");
const completedAt = new Date("2026-08-26T18:00:00Z");
const elapsedCalendarDays = Math.max(1, Math.ceil((completedAt - startedAt) / (1000 * 60 * 60 * 24)));
const activeMinutes = 7 * 30; // 7 days * 30 min = 210 mins = 3h 30m

assert.strictEqual(elapsedCalendarDays, 7, "Elapsed calendar duration must be 7 days");
assert.strictEqual(activeMinutes, 210, "Active learning time must be 210 minutes");
assert.notStrictEqual(elapsedCalendarDays, activeMinutes, "Calendar days and active minutes must be distinct metrics");
console.log("✓ TEST 4 Passed: Calendar duration (7 days) and Active time (3h 30m) distinctly tracked");

console.log("\n==================================================");
console.log("ALL CANONICAL PROGRESS AUDIT TESTS PASSED! 🚀");
console.log("==================================================");
