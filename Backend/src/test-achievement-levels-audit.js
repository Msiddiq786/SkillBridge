const assert = require("assert");
const { PREDEFINED_ACHIEVEMENTS } = require("./services/journey.service");

console.log("==================================================");
console.log("TESTING ACHIEVEMENT LEVELS & CAREER MILESTONES");
console.log("==================================================");

// ----------------------------------------------------
// TEST 1 — Verify All Core & Expanded Milestones
// ----------------------------------------------------
console.log("\n[TEST 1] Verifying Predefined Milestone Definitions...");
const requiredMilestoneIds = [
    "first_analysis",
    "first_journey",
    "first_day",
    "five_days",
    "journey_master",
    "roadmap_finisher",
    "streak_3",
    "streak_7",
    "streak_14",
    "skill_builder",
    "skill_master",
    "project_builder",
    "voice_pioneer",
    "quiz_champion",
    "star_storyteller",
    "interview_ready",
    "interview_practiced",
    "resume_builder",
    "application_ready_resume",
    "first_application",
    "offer_ready",
    "jd_ready"
];

requiredMilestoneIds.forEach(id => {
    assert(PREDEFINED_ACHIEVEMENTS[id], `Missing milestone definition for ${id}`);
    assert(PREDEFINED_ACHIEVEMENTS[id].targetValue > 0, `Milestone ${id} must have targetValue > 0`);
    assert(PREDEFINED_ACHIEVEMENTS[id].category, `Milestone ${id} must have a category`);
});
console.log(`✓ TEST 1 Passed: All ${requiredMilestoneIds.length} career milestones properly defined with targets and categories`);

// ----------------------------------------------------
// TEST 2 — Milestone Progress Calculation (1/3 skills, 1/2 projects)
// ----------------------------------------------------
console.log("\n[TEST 2] Testing Progress Ratio Calculation...");
const skillBuilder = PREDEFINED_ACHIEVEMENTS.skill_builder;
const progress1 = Math.round((2 / skillBuilder.targetValue) * 100);
assert.strictEqual(progress1, 67); // 2/3 = 67%

const projectBuilder = PREDEFINED_ACHIEVEMENTS.project_builder;
const progress2 = Math.round((1 / projectBuilder.targetValue) * 100);
assert.strictEqual(progress2, 50); // 1/2 = 50%
console.log("✓ TEST 2 Passed: Dynamic progress percentages calculated accurately (2/3 = 67%, 1/2 = 50%)");

console.log("\n==================================================");
console.log("ALL ACHIEVEMENT MILESTONE TESTS PASSED! 🚀");
console.log("==================================================");
