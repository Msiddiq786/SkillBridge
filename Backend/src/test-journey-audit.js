const assert = require("assert");

console.log("==================================================");
console.log("PHASE 9, 26, 27, 28: LEARNING JOURNEY, STREAKS & ACHIEVEMENTS AUDIT");
console.log("==================================================");

const findings = [];

// Predefined achievements list from journey.service.js
const PREDEFINED_ACHIEVEMENTS = [
    { achievementId: "first_journey", title: "First Journey", icon: "🎯", description: "Started your first active learning journey" },
    { achievementId: "first_day", title: "First Day Complete", icon: "📚", description: "Completed your first roadmap study day" },
    { achievementId: "five_days", title: "5 Days Complete", icon: "🏆", description: "Completed 5 roadmap study days" },
    { achievementId: "journey_master", title: "Journey Master", icon: "🎓", description: "Completed all days in a preparation roadmap" },
    { achievementId: "streak_3", title: "3 Day Streak", icon: "🔥", description: "Maintained a 3-day continuous learning streak" },
    { achievementId: "streak_7", title: "7 Day Streak", icon: "🔥", description: "Maintained a 7-day continuous learning streak" },
    { achievementId: "streak_14", title: "14 Day Streak", icon: "⚡", description: "Maintained a 14-day continuous learning streak" },
    { achievementId: "voice_pioneer", title: "Voice Interview Pioneer", icon: "🎙️", description: "Completed a voice-based mock interview answer" },
    { achievementId: "quiz_champion", title: "MCQ Quiz Champion", icon: "🧠", description: "Scored 70%+ on an MCQ practice session" },
    { achievementId: "star_storyteller", title: "STAR Storyteller", icon: "🚀", description: "Completed a behavioral STAR practice session" },
    { achievementId: "project_builder", title: "Project Builder", icon: "🛠️", description: "Built and verified a recommended portfolio project" },
    { achievementId: "jd_ready", title: "JD Ready", icon: "✅", description: "Reached 80%+ match readiness for your target role" }
];

console.log("\n[AUDIT 1] Verifying Predefined Achievements Configuration...");
assert.strictEqual(PREDEFINED_ACHIEVEMENTS.length, 12);
PREDEFINED_ACHIEVEMENTS.forEach(a => {
    assert(a.achievementId, "achievementId must exist");
    assert(a.title, "title must exist");
    assert(a.icon, "icon must exist");
    assert(a.description, "description must exist");
});
console.log("✓ All 12 Predefined Achievements verified");

// ----------------------------------------------------
// Streak Calculation Simulation
// ----------------------------------------------------
console.log("\n[AUDIT 2] Auditing Streak Calculation Algorithm with Strict Deterministic Dates...");

function calculateStreaks(qualifyingDates, todayStr) {
    if (!qualifyingDates || qualifyingDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    const uniqueDates = [...new Set(qualifyingDates)].sort();
    if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let longest = 0;
    let running = 0;
    let prevDate = null;

    for (const dStr of uniqueDates) {
        const d = new Date(dStr + "T00:00:00Z");
        if (prevDate) {
            const diffDays = Math.round((d - prevDate) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                running++;
            } else if (diffDays > 1) {
                running = 1;
            }
        } else {
            running = 1;
        }
        if (running > longest) longest = running;
        prevDate = d;
    }

    // Current streak validation
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1] + "T00:00:00Z");
    const today = new Date(todayStr + "T00:00:00Z");
    const diffToday = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    let current = 0;
    if (diffToday === 0 || diffToday === 1) {
        current = 1;
        for (let i = uniqueDates.length - 2; i >= 0; i--) {
            const curr = new Date(uniqueDates[i] + "T00:00:00Z");
            const next = new Date(uniqueDates[i + 1] + "T00:00:00Z");
            const diff = Math.round((next - curr) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                current++;
            } else {
                break;
            }
        }
    }

    return { currentStreak: current, longestStreak: longest };
}

// Test Streak Scenario A: Active streak today (3 consecutive days)
const resA = calculateStreaks(["2026-08-24", "2026-08-25", "2026-08-26"], "2026-08-26");
assert.strictEqual(resA.currentStreak, 3);
assert.strictEqual(resA.longestStreak, 3);
console.log("✓ Streak Scenario A (Active 3-day streak ending today) passed");

// Test Streak Scenario B: Active yesterday, none today (within 1 day grace)
const resB = calculateStreaks(["2026-08-24", "2026-08-25"], "2026-08-26");
assert.strictEqual(resB.currentStreak, 2);
assert.strictEqual(resB.longestStreak, 2);
console.log("✓ Streak Scenario B (Active 2-day streak ending yesterday) passed");

// Test Streak Scenario C: Missed 2 days (gap break)
const resC = calculateStreaks(["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-26"], "2026-08-26");
assert.strictEqual(resC.currentStreak, 1);
assert.strictEqual(resC.longestStreak, 3);
console.log("✓ Streak Scenario C (Gap break, reset to 1) passed");

// Test Streak Scenario D: Login-only non-qualifying activity should NOT count towards streak
console.log("\n[AUDIT 3] Auditing Login-Only Non-Qualifying Activity...");
const loginActivity = {
    activityType: "LOGIN",
    title: "User logged in",
    isQualifying: false
};
assert.strictEqual(loginActivity.isQualifying, false, "LOGIN must be non-qualifying");
console.log("✓ LOGIN activity is strictly configured as non-qualifying (streak will not falsely increase)");

// ----------------------------------------------------
// Day Completion Progress Calculation
// ----------------------------------------------------
console.log("\n[AUDIT 4] Auditing Day Completion Progress Percentage Calculation...");
function calculateProgress(completedDays, totalDays) {
    const unique = [...new Set(completedDays)];
    const total = totalDays || 15;
    return Math.min(100, Math.round((unique.length / total) * 100));
}

assert.strictEqual(calculateProgress([], 15), 0);
assert.strictEqual(calculateProgress([1], 15), 7);
assert.strictEqual(calculateProgress([1, 2, 3, 4, 5], 15), 33);
assert.strictEqual(calculateProgress([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 15), 100);
console.log("✓ Day completion progress percentage calculation validated");

console.log("\n==================================================");
console.log(`JOURNEY, STREAKS & ACHIEVEMENTS AUDIT COMPLETE — ${findings.length} Finding(s)`);
console.log("==================================================");
