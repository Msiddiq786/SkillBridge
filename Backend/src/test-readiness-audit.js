const assert = require("assert");

console.log("==================================================");
console.log("TESTING APPLICATION READINESS CENTER CALCULATION & EVIDENCE");
console.log("==================================================");

// Mock readiness computation logic
function computeMockReadiness({
    report = null,
    journey = null,
    profile = null,
    completedSessions = [],
    resumeVersions = []
}) {
    if (!report) {
        return { hasReport: false, message: "No report found" };
    }

    const jdMatch = typeof report.matchScore === "number" ? report.matchScore : 50;
    const classifications = Array.isArray(report.skillClassification) ? report.skillClassification : [];
    const requiredSkillsCount = classifications.length || 10;
    const presentSkills = classifications.filter(s => s.status === "PRESENT");
    const missingSkills = classifications.filter(s => s.status === "MISSING" || s.status === "NOT_DEMONSTRATED");

    const verifiedSkillsSet = new Set();
    if (profile && Array.isArray(profile.skills)) {
        profile.skills.forEach(s => {
            if (s && s.name && (s.evidenceType === "VERIFIED" || s.source === "Resume" || s.source === "Project")) {
                verifiedSkillsSet.add(s.name.trim().toLowerCase());
            }
        });
    }

    const requiredSkillsList = classifications.map(c => {
        const name = c.skill || c.requirement || "Required Skill";
        const isVerified = verifiedSkillsSet.has(name.trim().toLowerCase()) || c.status === "PRESENT";
        return { name, status: c.status, isVerified };
    });

    const verifiedSkillsCount = requiredSkillsList.filter(s => s.isVerified).length;

    const roadmapTotalDays = journey?.roadmapDays || 15;
    const roadmapCompletedDays = journey?.completedDays?.length || 0;
    const roadmapProgress = journey?.overallProgress || (roadmapTotalDays > 0 ? Math.round((roadmapCompletedDays / roadmapTotalDays) * 100) : 0);

    let technicalScore = 0;
    let technicalCount = 0;
    completedSessions.forEach(s => {
        if (typeof s.overallScore === "number") {
            technicalScore += s.overallScore;
            technicalCount++;
        }
    });
    const avgTech = technicalCount > 0 ? Math.round(technicalScore / technicalCount) : null;

    const recommendedProjects = Array.isArray(report.recommendedProjects) ? report.recommendedProjects : [];
    const completedProjectsCount = recommendedProjects.filter(p => p.status === "COMPLETED").length;
    const profileCompletedProjects = (profile?.projects || []).filter(p => p.status === "Completed").length;
    const actualProjectsCompleted = Math.max(completedProjectsCount, profileCompletedProjects);

    const hasJdReadyResume = resumeVersions.some(v => v.versionType === "JD_READY") || Boolean(report.atsAnalysis?.atsScore >= 70);

    const practiceFactor = avgTech !== null ? avgTech : jdMatch;
    const jdReadiness = Math.min(100, Math.round((jdMatch * 0.4) + (roadmapProgress * 0.4) + (practiceFactor * 0.2)));

    let readyStatus = "NEEDS PREPARATION";
    if (jdReadiness >= 75 && verifiedSkillsCount >= Math.round(requiredSkillsCount * 0.6)) {
        readyStatus = "READY TO APPLY";
    } else if (jdReadiness >= 50 || verifiedSkillsCount >= Math.round(requiredSkillsCount * 0.4)) {
        readyStatus = "ALMOST READY";
    }

    // Next action
    let nextAction = "READY";
    if (missingSkills.length > 0 && verifiedSkillsCount < Math.round(requiredSkillsCount * 0.5)) {
        nextAction = `VERIFY_SKILL_${missingSkills[0].skill || missingSkills[0].requirement}`;
    } else if (roadmapCompletedDays < roadmapTotalDays && roadmapProgress < 80) {
        nextAction = "CONTINUE_ROADMAP";
    } else if (avgTech === null || avgTech < 70) {
        nextAction = "PRACTICE_TECHNICAL";
    } else if (!hasJdReadyResume) {
        nextAction = "GENERATE_RESUME";
    }

    return {
        hasReport: true,
        jdMatch,
        readinessScore: jdReadiness,
        readyStatus,
        requiredSkillsCount,
        verifiedSkillsCount,
        roadmapProgress,
        roadmapCompletedDays,
        technicalPractice: avgTech,
        projectsCompleted: actualProjectsCompleted,
        hasJdReadyResume,
        nextAction
    };
}

// ----------------------------------------------------
// TEST 1 — Needs Preparation State (Critical Gaps)
// ----------------------------------------------------
console.log("\n[TEST 1] Testing Unprepared Candidate (Needs Preparation)...");
const rep1 = {
    _id: "rep-01",
    title: "AI / ML Intern",
    company: "NeuralTech",
    matchScore: 45,
    skillClassification: [
        { requirement: "Python", skill: "Python", status: "PRESENT" },
        { requirement: "PyTorch", skill: "PyTorch", status: "MISSING" },
        { requirement: "RAG Architecture", skill: "RAG Architecture", status: "MISSING" },
        { requirement: "Docker", skill: "Docker", status: "MISSING" },
        { requirement: "FastAPI", skill: "FastAPI", status: "MISSING" }
    ]
};

const res1 = computeMockReadiness({ report: rep1, journey: null });
assert.strictEqual(res1.readyStatus, "NEEDS PREPARATION");
assert.strictEqual(res1.nextAction, "VERIFY_SKILL_PyTorch");
console.log("✓ TEST 1 Passed: Correctly identified as NEEDS PREPARATION with exact missing skill blocker");

// ----------------------------------------------------
// TEST 2 — Almost Ready State (Some Progress)
// ----------------------------------------------------
console.log("\n[TEST 2] Testing In-Progress Candidate (Almost Ready)...");
const j2 = { completedDays: [1, 2, 3, 4, 5, 6, 7, 8], roadmapDays: 15, overallProgress: 53 };
const prof2 = {
    skills: [
        { name: "Python", evidenceType: "VERIFIED" },
        { name: "PyTorch", evidenceType: "VERIFIED" }
    ]
};
const res2 = computeMockReadiness({
    report: { ...rep1, matchScore: 60 },
    journey: j2,
    profile: prof2,
    completedSessions: [{ overallScore: 72 }]
});

assert.strictEqual(res2.readyStatus, "ALMOST READY");
console.log("✓ TEST 2 Passed: Candidate in progress correctly evaluated as ALMOST READY");

// ----------------------------------------------------
// TEST 3 — Ready To Apply (All Criteria Met)
// ----------------------------------------------------
console.log("\n[TEST 3] Testing Fully Prepared Candidate (Ready to Apply)...");
const j3 = { completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], roadmapDays: 15, overallProgress: 100 };
const prof3 = {
    skills: [
        { name: "Python", evidenceType: "VERIFIED" },
        { name: "PyTorch", evidenceType: "VERIFIED" },
        { name: "RAG Architecture", evidenceType: "VERIFIED" },
        { name: "Docker", evidenceType: "VERIFIED" }
    ],
    projects: [{ name: "RAG Document Assistant", status: "Completed" }]
};
const res3 = computeMockReadiness({
    report: { ...rep1, matchScore: 85, atsAnalysis: { atsScore: 88 } },
    journey: j3,
    profile: prof3,
    completedSessions: [{ overallScore: 88 }],
    resumeVersions: [{ versionType: "JD_READY", versionNumber: 2 }]
});

assert.strictEqual(res3.readyStatus, "READY TO APPLY");
assert.strictEqual(res3.nextAction, "READY");
assert(res3.readinessScore >= 85);
console.log("✓ TEST 3 Passed: Fully prepared candidate correctly evaluated as READY TO APPLY");

console.log("\n==================================================");
console.log("ALL READINESS TESTS PASSED! 🚀");
console.log("==================================================");
