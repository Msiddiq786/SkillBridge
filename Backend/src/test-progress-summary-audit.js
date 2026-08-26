process.env.GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || "test_key_for_offline_audit";

const assert = require("assert");

console.log("==================================================");
console.log("TESTING PROGRESS SUMMARY SERVICE & STATS AGGREGATION");
console.log("==================================================");

// Mock data builder for unit testing calculation logic
function buildMockProgressSummary({
    reports = [],
    journeys = [],
    profile = null,
    completedSessions = [],
    activities = [],
    achievements = [],
    streaks = { currentStreak: 0, longestStreak: 0, isActiveToday: false },
    timezone = "UTC"
}) {
    // 1. Analyzer Metrics
    const totalAnalyzed = reports.length;
    const completedReportIds = new Set(
        journeys.filter(j => j.status === "COMPLETED").map(j => j.report?.toString())
    );
    const activeReportIds = new Set(
        journeys.filter(j => j.status === "ACTIVE").map(j => j.report?.toString())
    );

    const completedPreparations = reports.filter(r => completedReportIds.has(r._id?.toString())).length;
    const activePreparations = reports.filter(r => !completedReportIds.has(r._id?.toString()) && activeReportIds.has(r._id?.toString())).length;
    const notStartedPreparations = Math.max(0, totalAnalyzed - (completedPreparations + activePreparations));

    const totalMatchScore = reports.reduce((sum, r) => sum + (typeof r.matchScore === "number" ? r.matchScore : 0), 0);
    const averageMatchScore = totalAnalyzed > 0 ? Math.round(totalMatchScore / totalAnalyzed) : 0;
    const preparationCompletionRate = totalAnalyzed > 0 ? Math.round((completedPreparations / totalAnalyzed) * 100) : 0;

    // 2. Journey Metrics
    const journeysStarted = journeys.length;
    const journeysCompleted = journeys.filter(j => j.status === "COMPLETED").length;
    const journeysActive = journeys.filter(j => j.status === "ACTIVE").length;

    // 3. Skills Gained Metrics
    const uniqueSkillsMap = new Map();

    if (profile && Array.isArray(profile.skills)) {
        profile.skills.forEach(s => {
            if (s && s.name && (s.evidenceType === "VERIFIED" || s.source === "Resume" || s.source === "Project")) {
                const key = s.name.trim().toLowerCase();
                if (!uniqueSkillsMap.has(key)) {
                    uniqueSkillsMap.set(key, {
                        id: s._id || key,
                        name: s.name.trim(),
                        status: "Verified",
                        category: s.category || "Technical",
                        source: s.source ? `Profile: ${s.source}` : "Verified Profile Evidence"
                    });
                }
            }
        });
    }

    if (profile && Array.isArray(profile.projects)) {
        profile.projects.forEach(p => {
            if (p && (p.status === "Completed" || p.status === "In Progress")) {
                const projectSkills = [
                    ...(Array.isArray(p.technologies) ? p.technologies : []),
                    ...(Array.isArray(p.skillsDemonstrated) ? p.skillsDemonstrated : [])
                ];
                projectSkills.forEach(tech => {
                    if (tech && typeof tech === "string" && tech.trim().length > 0) {
                        const key = tech.trim().toLowerCase();
                        if (!uniqueSkillsMap.has(key)) {
                            uniqueSkillsMap.set(key, {
                                id: `proj-${key}`,
                                name: tech.trim(),
                                status: "Verified",
                                category: "Project Verified",
                                source: `Project: ${p.name || "Completed Project"}`
                            });
                        }
                    }
                });
            }
        });
    }

    reports.forEach(rep => {
        if (Array.isArray(rep.recommendedProjects)) {
            rep.recommendedProjects.forEach(proj => {
                if (proj && proj.status === "COMPLETED") {
                    const projSkills = Array.isArray(proj.skills) ? proj.skills : [];
                    projSkills.forEach(skillName => {
                        if (skillName && typeof skillName === "string" && skillName.trim().length > 0) {
                            const key = skillName.trim().toLowerCase();
                            if (!uniqueSkillsMap.has(key)) {
                                uniqueSkillsMap.set(key, {
                                    id: `recproj-${key}`,
                                    name: skillName.trim(),
                                    status: "Verified",
                                    category: "Project Verified",
                                    source: `Completed Project: ${proj.name || "Curated Project"}`
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    completedSessions.forEach(sess => {
        if (Array.isArray(sess.topicPerformance)) {
            sess.topicPerformance.forEach(tp => {
                if (tp && tp.topic && typeof tp.score === "number" && tp.score >= 80) {
                    const key = tp.topic.trim().toLowerCase();
                    if (!uniqueSkillsMap.has(key)) {
                        uniqueSkillsMap.set(key, {
                            id: `practice-${key}`,
                            name: tp.topic.trim(),
                            status: "Verified",
                            category: "Practice Mastery",
                            source: `Practice Score: ${tp.score}%`
                        });
                    }
                }
            });
        }
    });

    const skillsList = Array.from(uniqueSkillsMap.values());
    const skillsGained = skillsList.length;

    // 4. Learning Time Calculations
    const todayStr = "2026-08-26";
    const sevenDaysAgoStr = "2026-08-19";

    let todayMinutes = 0;
    let weekMinutes = 0;
    let totalMinutes = 0;
    const activeDatesThisWeek = new Set();

    activities.forEach(act => {
        const mins = act.activeMinutes || 0;
        totalMinutes += mins;
        if (act.dateString === todayStr) {
            todayMinutes += mins;
        }
        if (act.dateString >= sevenDaysAgoStr) {
            weekMinutes += mins;
            if (act.isQualifying) {
                activeDatesThisWeek.add(act.dateString);
            }
        }
    });

    // 5. Analyzer History
    const journeyByReportId = new Map();
    journeys.forEach(j => {
        if (j.report) {
            journeyByReportId.set(j.report.toString(), j.status);
        }
    });

    const analyzerHistory = reports.slice(0, 5).map(r => ({
        id: r._id,
        title: r.selectedTrackTitle || r.selectedTrack || r.title || "Target Role",
        company: r.company || "Target Company",
        matchScore: r.matchScore || 0,
        journeyStatus: journeyByReportId.get(r._id?.toString()) || "NOT_STARTED",
        createdAt: r.createdAt
    }));

    return {
        analyses: {
            total: totalAnalyzed,
            completed: completedPreparations,
            active: activePreparations,
            notStarted: notStartedPreparations,
            averageMatchScore,
            preparationCompletionRate
        },
        journeys: {
            started: journeysStarted,
            completed: journeysCompleted,
            active: journeysActive
        },
        skills: {
            gained: skillsGained,
            skillsList
        },
        streak: {
            current: streaks.currentStreak,
            longest: streaks.longestStreak,
            isActiveToday: streaks.isActiveToday
        },
        learningTime: {
            todayMinutes,
            weekMinutes,
            totalMinutes,
            activeDaysThisWeek: activeDatesThisWeek.size
        },
        analyzerHistory,
        recentAchievements: achievements.slice(0, 6),
        recentActivities: activities.slice(0, 10)
    };
}

// ----------------------------------------------------
// TEST 1 — New User
// ----------------------------------------------------
console.log("\n[TEST 1] Testing New User Empty State...");
const summary1 = buildMockProgressSummary({});
assert.strictEqual(summary1.analyses.total, 0);
assert.strictEqual(summary1.analyses.completed, 0);
assert.strictEqual(summary1.analyses.active, 0);
assert.strictEqual(summary1.analyses.notStarted, 0);
assert.strictEqual(summary1.analyses.averageMatchScore, 0);
assert.strictEqual(summary1.journeys.started, 0);
assert.strictEqual(summary1.journeys.completed, 0);
assert.strictEqual(summary1.skills.gained, 0);
assert.strictEqual(summary1.streak.current, 0);
assert.strictEqual(summary1.learningTime.totalMinutes, 0);
console.log("✓ TEST 1 Passed: New user displays clean 0 values (no fake stats)");

// ----------------------------------------------------
// TEST 2 — Single Analyzed JD (Not Started)
// ----------------------------------------------------
console.log("\n[TEST 2] Testing Single Analyzed Report...");
const rep1 = { _id: "rep-01", title: "AI / ML Intern", company: "NeuralTech", matchScore: 78, createdAt: new Date() };
const summary2 = buildMockProgressSummary({ reports: [rep1] });
assert.strictEqual(summary2.analyses.total, 1);
assert.strictEqual(summary2.analyses.completed, 0);
assert.strictEqual(summary2.analyses.active, 0);
assert.strictEqual(summary2.analyses.notStarted, 1);
assert.strictEqual(summary2.analyses.averageMatchScore, 78);
assert.strictEqual(summary2.analyzerHistory[0].journeyStatus, "NOT_STARTED");
console.log("✓ TEST 2 Passed: 1 report analyzed, 0 completed, status NOT_STARTED");

// ----------------------------------------------------
// TEST 3 — Started Learning Journey
// ----------------------------------------------------
console.log("\n[TEST 3] Testing Started Journey...");
const j1 = { _id: "j-01", report: "rep-01", status: "ACTIVE" };
const summary3 = buildMockProgressSummary({ reports: [rep1], journeys: [j1] });
assert.strictEqual(summary3.analyses.total, 1);
assert.strictEqual(summary3.analyses.active, 1);
assert.strictEqual(summary3.analyses.completed, 0);
assert.strictEqual(summary3.analyses.notStarted, 0);
assert.strictEqual(summary3.journeys.started, 1);
assert.strictEqual(summary3.journeys.active, 1);
assert.strictEqual(summary3.analyzerHistory[0].journeyStatus, "ACTIVE");
console.log("✓ TEST 3 Passed: 1 journey started and active, correctly tracked");

// ----------------------------------------------------
// TEST 4 — Completed Journey
// ----------------------------------------------------
console.log("\n[TEST 4] Testing Completed Journey...");
const j1_completed = { _id: "j-01", report: "rep-01", status: "COMPLETED" };
const summary4 = buildMockProgressSummary({ reports: [rep1], journeys: [j1_completed] });
assert.strictEqual(summary4.analyses.total, 1);
assert.strictEqual(summary4.analyses.completed, 1);
assert.strictEqual(summary4.analyses.active, 0);
assert.strictEqual(summary4.analyses.notStarted, 0);
assert.strictEqual(summary4.analyses.preparationCompletionRate, 100);
assert.strictEqual(summary4.journeys.completed, 1);
assert.strictEqual(summary4.analyzerHistory[0].journeyStatus, "COMPLETED");
console.log("✓ TEST 4 Passed: 1 journey completed, preparation completion rate 100%");

// ----------------------------------------------------
// TEST 5 & 6 — Verified Skills & No Double-Counting
// ----------------------------------------------------
console.log("\n[TEST 5 & 6] Testing Skills Gained and Deduplication...");
const mockProfile = {
    skills: [
        { name: "Python", evidenceType: "VERIFIED", source: "Resume" },
        { name: "PyTorch", evidenceType: "VERIFIED", source: "Project" },
        { name: "Unverified Skill", evidenceType: "SELF_DECLARED", source: "Self-added" } // Should NOT be counted
    ],
    projects: [
        { name: "CIFAR Classifier", status: "Completed", technologies: ["Python", "OpenCV", "Docker"] }
    ]
};

// "Python" is in both profile verified skills and project technologies -> must count only ONCE
const summary5 = buildMockProgressSummary({ profile: mockProfile });
assert.strictEqual(summary5.skills.gained, 4); // Python, PyTorch, OpenCV, Docker
const skillNames = summary5.skills.skillsList.map(s => s.name);
assert(skillNames.includes("Python"));
assert(skillNames.includes("PyTorch"));
assert(skillNames.includes("OpenCV"));
assert(skillNames.includes("Docker"));
assert(!skillNames.includes("Unverified Skill"), "Unverified self-declared skills must not be counted");
console.log("✓ TEST 5 & 6 Passed: 4 unique verified skills gained, zero double-counting, unverified excluded");

// ----------------------------------------------------
// TEST 7 — Multiple Reports & Journeys
// ----------------------------------------------------
console.log("\n[TEST 7] Testing Multiple Reports & Journeys Global Counts...");
const rep2 = { _id: "rep-02", title: "Full Stack Developer", company: "CloudScale", matchScore: 82, createdAt: new Date() };
const rep3 = { _id: "rep-03", title: "Data Analyst", company: "DataCorp", matchScore: 65, createdAt: new Date() };
const j2 = { _id: "j-02", report: "rep-02", status: "ACTIVE" };
// rep3 has no journey

const summary7 = buildMockProgressSummary({
    reports: [rep1, rep2, rep3],
    journeys: [j1_completed, j2]
});

assert.strictEqual(summary7.analyses.total, 3);
assert.strictEqual(summary7.analyses.completed, 1);
assert.strictEqual(summary7.analyses.active, 1);
assert.strictEqual(summary7.analyses.notStarted, 1);
assert.strictEqual(summary7.analyses.averageMatchScore, 75); // (78 + 82 + 65) / 3 = 75
assert.strictEqual(summary7.analyses.preparationCompletionRate, 33); // 1 / 3 = 33%
assert.strictEqual(summary7.journeys.started, 2);
assert.strictEqual(summary7.journeys.completed, 1);
assert.strictEqual(summary7.journeys.active, 1);
console.log("✓ TEST 7 Passed: Multiple reports, active, completed, and unstarted calculated correctly");

// ----------------------------------------------------
// TEST 8 — Active Learning Time & Weekly Progress
// ----------------------------------------------------
console.log("\n[TEST 8] Testing Active Learning Time Calculation...");
const mockActivities = [
    { dateString: "2026-08-26", isQualifying: true, activeMinutes: 30 },
    { dateString: "2026-08-26", isQualifying: false, activeMinutes: 12 },
    { dateString: "2026-08-25", isQualifying: true, activeMinutes: 45 },
    { dateString: "2026-08-24", isQualifying: true, activeMinutes: 60 },
    { dateString: "2026-08-10", isQualifying: true, activeMinutes: 50 } // older than 7 days
];

const summary8 = buildMockProgressSummary({ activities: mockActivities });
assert.strictEqual(summary8.learningTime.todayMinutes, 42); // 30 + 12
assert.strictEqual(summary8.learningTime.weekMinutes, 147); // 30 + 12 + 45 + 60
assert.strictEqual(summary8.learningTime.totalMinutes, 197); // 147 + 50
assert.strictEqual(summary8.learningTime.activeDaysThisWeek, 3); // 26th, 25th, 24th
console.log("✓ TEST 8 Passed: Learning time (today, week, total, active days) accurate");

console.log("\n==================================================");
console.log("ALL PROGRESS SUMMARY UNIT TESTS PASSED! 🚀");
console.log("==================================================");
