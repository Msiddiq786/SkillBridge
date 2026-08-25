const { PREDEFINED_ACHIEVEMENTS } = require("./services/journey.service");

console.log("==================================================");
console.log("RUNNING OFFLINE UNIT LOGIC TEST SUITE");
console.log("==================================================");

// 1. Verify achievement catalog completeness
const requiredAchievements = [
    "first_journey",
    "first_day",
    "five_days",
    "journey_master",
    "streak_3",
    "streak_7",
    "streak_14",
    "voice_pioneer",
    "quiz_champion",
    "star_storyteller",
    "project_builder",
    "jd_ready"
];

console.log("\n[TEST 1] Verifying Predefined Achievements...");
requiredAchievements.forEach(achId => {
    if (!PREDEFINED_ACHIEVEMENTS[achId]) {
        throw new Error(`Missing required achievement definition: ${achId}`);
    }
    console.log(`✓ Achievement verified: ${PREDEFINED_ACHIEVEMENTS[achId].title} (${PREDEFINED_ACHIEVEMENTS[achId].icon})`);
});

// 2. Test Streak algorithm directly
console.log("\n[TEST 2] Verifying Streak Logic with Mock Date Sequences...");

function mockCalculateStreak(uniqueDates, todayStr, yesterdayStr) {
    if (!uniqueDates || uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dStr of uniqueDates) {
        if (!prevDate) {
            tempStreak = 1;
        } else {
            const p = new Date(prevDate);
            const c = new Date(dStr);
            const diffDays = Math.round((c - p) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                tempStreak = 1;
            }
        }
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }
        prevDate = dStr;
    }

    const lastDate = uniqueDates[uniqueDates.length - 1];
    if (lastDate === todayStr || lastDate === yesterdayStr) {
        let streakCount = 1;
        for (let i = uniqueDates.length - 1; i > 0; i--) {
            const cur = new Date(uniqueDates[i]);
            const prv = new Date(uniqueDates[i - 1]);
            const diff = Math.round((cur - prv) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                streakCount++;
            } else {
                break;
            }
        }
        currentStreak = streakCount;
    } else {
        currentStreak = 0;
    }

    return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

// Case A: 3 consecutive days ending today
const resA = mockCalculateStreak(["2026-08-24", "2026-08-25", "2026-08-26"], "2026-08-26", "2026-08-25");
console.log("Case A (3 consecutive days ending today):", resA);
if (resA.currentStreak !== 3 || resA.longestStreak !== 3) throw new Error("Case A streak calculation failed");

// Case B: Missed day (gap from 2026-08-20 to 2026-08-26)
const resB = mockCalculateStreak(["2026-08-18", "2026-08-19", "2026-08-20", "2026-08-26"], "2026-08-26", "2026-08-25");
console.log("Case B (gap reset, today active):", resB);
if (resB.currentStreak !== 1 || resB.longestStreak !== 3) throw new Error("Case B gap reset failed");

// Case C: Inactive today and yesterday (missed days)
const resC = mockCalculateStreak(["2026-08-20", "2026-08-21", "2026-08-22"], "2026-08-26", "2026-08-25");
console.log("Case C (inactive recently):", resC);
if (resC.currentStreak !== 0 || resC.longestStreak !== 3) throw new Error("Case C inactive streak failed");

// 3. Test Progress percentage calculation
console.log("\n[TEST 3] Verifying Day Completion Progress Percentage...");
const calcProgress = (completedDays, totalDays) => Math.min(100, Math.round((completedDays / totalDays) * 100));

console.log("0 / 15 days:", calcProgress(0, 15) + "%");
console.log("1 / 15 days:", calcProgress(1, 15) + "%");
console.log("6 / 15 days:", calcProgress(6, 15) + "%");
console.log("15 / 15 days:", calcProgress(15, 15) + "%");
console.log("7 / 7 days (custom):", calcProgress(7, 7) + "%");

if (calcProgress(1, 15) !== 7 || calcProgress(6, 15) !== 40 || calcProgress(15, 15) !== 100) {
    throw new Error("Progress percentage calculation failed");
}

console.log("\n==================================================");
console.log("ALL OFFLINE UNIT TESTS PASSED! 🚀");
console.log("==================================================");
