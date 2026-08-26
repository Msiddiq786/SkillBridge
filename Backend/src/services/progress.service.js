const Progress = require("../models/progress.model");

// In-memory per-user async mutex to guarantee atomic sequencing of parallel completions
const userLocks = new Map();

function withUserLock(userId, fn) {
    const key = String(userId);
    const prevPromise = userLocks.get(key) || Promise.resolve();
    const currentPromise = prevPromise.then(async () => {
        try {
            return await fn();
        } finally {
            if (userLocks.get(key) === currentPromise) {
                userLocks.delete(key);
            }
        }
    });
    userLocks.set(key, currentPromise);
    return currentPromise;
}

/**
 * Initialize a new generation progress record
 */
async function initProgress(userId) {
    return withUserLock(userId, async () => {
        return await Progress.findOneAndUpdate(
            { user: userId },
            {
                progress: 0,
                status: "Reading Resume",
                stage: "READING_RESUME",
                stages: {
                    readingResume: "IN_PROGRESS",
                    resumeAnalysis: "PENDING",
                    technical: "PENDING",
                    mcq: "PENDING",
                    behavioral: "PENDING",
                    skillGap: "PENDING",
                    roadmap: "PENDING",
                    finalizing: "PENDING"
                },
                updatedAt: new Date()
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
    });
}

/**
 * Update a specific stage with monotonic progress guarantees and race-condition safety
 */
async function updateStage(userId, stageName, stageState = "COMPLETED", customStatusText = null) {
    return withUserLock(userId, async () => {
        let doc = await Progress.findOne({ user: userId });
        if (!doc) {
            doc = new Progress({
                user: userId,
                progress: 0,
                status: "Reading Resume",
                stage: "READING_RESUME"
            });
        }

        if (stageName && doc.stages && doc.stages[stageName] !== undefined) {
            doc.stages[stageName] = stageState;
        }

        let calculatedProgress = 0;
        let statusText = customStatusText || doc.status;

        // Phase 1: Resume Analysis (0 -> 15%)
        if (doc.stages.readingResume === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 5);
            if (!customStatusText) statusText = "Analyzing Resume";
        }
        if (doc.stages.resumeAnalysis === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 15);
            if (!customStatusText) statusText = "Generating Interview Content";
        }

        // Phase 2: Parallel Content Generation (15 -> 65%, 4 tasks @ 12.5% each)
        const parallelKeys = ["technical", "mcq", "behavioral", "skillGap"];
        const completedParallelCount = parallelKeys.filter(k => doc.stages[k] === "COMPLETED").length;
        
        if (doc.stages.resumeAnalysis === "COMPLETED") {
            const parallelIncrement = Math.round(completedParallelCount * 12.5); // 0, 13, 25, 38, 50
            calculatedProgress = Math.max(calculatedProgress, 15 + parallelIncrement);
        }

        // Phase 3: Roadmap (65 -> 85%)
        if (doc.stages.roadmap === "IN_PROGRESS") {
            calculatedProgress = Math.max(calculatedProgress, 65);
            if (!customStatusText) statusText = "Building Roadmap";
        } else if (doc.stages.roadmap === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 85);
            if (!customStatusText) statusText = "Finalizing Report";
        }

        // Phase 4: Finalizing (85 -> 95%)
        if (doc.stages.finalizing === "IN_PROGRESS" || doc.stages.finalizing === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 95);
            if (!customStatusText) statusText = "Finalizing Report";
        }

        // Phase 5: Completed (100%)
        if (stageName === "COMPLETED" || doc.status === "Completed") {
            calculatedProgress = 100;
            statusText = "Completed";
        }

        // Failure State: Keep last confirmed percentage, do NOT reset to 0
        if (stageState === "FAILED" || stageName === "FAILED") {
            statusText = "Failed";
        }

        // STRICT MONOTONIC RULE: newProgress is always >= previousProgress
        const finalProgress = Math.max(doc.progress || 0, calculatedProgress);

        doc.progress = finalProgress;
        doc.status = statusText;
        doc.stage = stageName || doc.stage;
        doc.updatedAt = new Date();

        await doc.save();
        return doc;
    });
}

/**
 * Direct progress update with monotonic safety
 */
async function updateProgress(userId, progress, status = "IN_PROGRESS") {
    return withUserLock(userId, async () => {
        let doc = await Progress.findOne({ user: userId });
        if (!doc) {
            doc = new Progress({ user: userId });
        }

        const finalProgress = Math.max(doc.progress || 0, progress);
        doc.progress = finalProgress;
        doc.status = status;
        doc.updatedAt = new Date();

        await doc.save();
        return doc;
    });
}

/**
 * Get current generation progress
 */
async function getProgress(userId) {
    const progress = await Progress.findOne({ user: userId });
    if (!progress) {
        return {
            progress: 0,
            status: "IDLE",
            stage: "START",
            stages: {
                readingResume: "PENDING",
                resumeAnalysis: "PENDING",
                technical: "PENDING",
                mcq: "PENDING",
                behavioral: "PENDING",
                skillGap: "PENDING",
                roadmap: "PENDING",
                finalizing: "PENDING"
            }
        };
    }
    return progress;
}

/**
 * Helper to get YYYY-MM-DD string in user's timezone
 */
function getLocalDateString(date = new Date(), timezone = "UTC") {
    try {
        const d = new Date(date);
        const options = { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" };
        const formatter = new Intl.DateTimeFormat("en-CA", options);
        return formatter.format(d);
    } catch {
        return new Date(date).toISOString().split("T")[0];
    }
}

/**
 * Get Comprehensive User Progress Summary (Analyses, Journeys, Skills Gained, Streaks, Learning Time)
 */
async function getUserProgressSummary({ userId, timezone = "UTC" }) {
    const interviewReportModel = require("../models/interviewReport.model");
    const LearningJourney = require("../models/learningJourney.model");
    const LearningActivity = require("../models/learningActivity.model");
    const Achievement = require("../models/achievement.model");
    const PracticeSession = require("../models/practiceSession.model");
    const ProfileModel = require("../models/profile.model");
    const journeyService = require("./journey.service");

    const [reports, journeys, profile, completedSessions, allActivities, achievements, streaks] = await Promise.all([
        interviewReportModel.find({ user: userId }).sort({ createdAt: -1 }),
        LearningJourney.find({ user: userId }).sort({ updatedAt: -1 }),
        ProfileModel.findOne({ user: userId }),
        PracticeSession.find({ user: userId, status: "COMPLETED" }),
        LearningActivity.find({ user: userId }).sort({ createdAt: -1 }),
        Achievement.find({ user: userId }).sort({ unlockedAt: -1 }),
        journeyService.calculateStreaks(userId, timezone)
    ]);

    // 1. Journey Auto-Healing & Status Normalization
    const reportsMap = new Map();
    reports.forEach(r => reportsMap.set(r._id.toString(), r));

    for (const j of journeys) {
        const rep = j.report ? reportsMap.get(j.report.toString()) : null;
        const totalDays = j.roadmapDays || rep?.preparationPlan?.length || 15;
        const isComplete = j.status === "COMPLETED" || (j.completedDays && j.completedDays.length >= totalDays && totalDays > 0) || j.overallProgress === 100;
        
        if (isComplete && (j.status !== "COMPLETED" || !j.completedAt || j.overallProgress !== 100)) {
            j.status = "COMPLETED";
            j.overallProgress = 100;
            if (!j.completedAt) j.completedAt = j.lastActivityAt || j.updatedAt || new Date();
            try {
                await j.save();
            } catch (e) {
                // Ignore save error during read
            }
        }
    }

    // 2. Analyzer Metrics
    const totalAnalyzed = reports.length;
    const completedReportIds = new Set(
        journeys.filter(j => j.status === "COMPLETED").map(j => j.report?.toString())
    );
    const activeReportIds = new Set(
        journeys.filter(j => j.status === "ACTIVE").map(j => j.report?.toString())
    );

    const completedPreparations = reports.filter(r => completedReportIds.has(r._id.toString())).length;
    const activePreparations = reports.filter(r => !completedReportIds.has(r._id.toString()) && activeReportIds.has(r._id.toString())).length;
    const notStartedPreparations = Math.max(0, totalAnalyzed - (completedPreparations + activePreparations));

    const totalMatchScore = reports.reduce((sum, r) => sum + (typeof r.matchScore === "number" ? r.matchScore : 0), 0);
    const averageMatchScore = totalAnalyzed > 0 ? Math.round(totalMatchScore / totalAnalyzed) : 0;
    const preparationCompletionRate = totalAnalyzed > 0 ? Math.round((completedPreparations / totalAnalyzed) * 100) : 0;

    // 3. Journey Metrics
    const journeysStarted = journeys.length;
    const journeysCompleted = journeys.filter(j => j.status === "COMPLETED").length;
    const journeysActive = journeys.filter(j => j.status === "ACTIVE").length;
    const averageCompletion = journeysStarted > 0 
        ? Math.round(journeys.reduce((sum, j) => sum + (j.overallProgress || 0), 0) / journeysStarted) 
        : 0;

    // 4. Skills Gained Metrics (Strictly deduplicated by canonical lowercase key)
    const uniqueSkillsMap = new Map();

    // 4a. Verified Profile Skills
    if (profile && Array.isArray(profile.skills)) {
        profile.skills.forEach(s => {
            if (s && s.name && (s.evidenceType === "VERIFIED" || s.source === "Resume" || s.source === "Project")) {
                const key = s.name.trim().toLowerCase();
                if (!uniqueSkillsMap.has(key)) {
                    uniqueSkillsMap.set(key, {
                        id: s._id?.toString() || key,
                        name: s.name.trim(),
                        status: "Verified",
                        previousStatus: "MISSING",
                        category: s.category || "Technical",
                        level: s.level || "Intermediate",
                        source: s.source ? `Profile: ${s.source}` : "Verified Profile Evidence",
                        gainedAt: profile.updatedAt || new Date()
                    });
                }
            }
        });
    }

    // 4b. Skills from Completed Projects (Profile Projects)
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
                                previousStatus: "PARTIAL",
                                category: "Project Verified",
                                level: "Intermediate",
                                source: `Project: ${p.name || "Completed Project"}`,
                                gainedAt: p.updatedAt || new Date()
                            });
                        }
                    }
                });
            }
        });
    }

    // 4c. Skills from Completed Recommended Projects in Reports
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
                                    previousStatus: "MISSING",
                                    category: "Project Verified",
                                    level: "Intermediate",
                                    source: `Completed Project: ${proj.name || "Curated Project"}`,
                                    gainedAt: rep.updatedAt || new Date()
                                });
                            }
                        }
                    });
                }
            });
        }
    });

    // 4d. High-scoring Practice Mastery (PracticeSession with topicPerformance score >= 80)
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
                            previousStatus: "PARTIAL",
                            category: "Practice Mastery",
                            level: "Advanced",
                            source: `Practice Score: ${tp.score}%`,
                            gainedAt: sess.completedAt || sess.updatedAt || new Date()
                        });
                    }
                }
            });
        }
    });

    const skillsList = Array.from(uniqueSkillsMap.values());
    const skillsGained = skillsList.length;

    // 5. Learning Time Calculations
    const todayStr = getLocalDateString(new Date(), timezone);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo, timezone);

    let todayMinutes = 0;
    let weekMinutes = 0;
    let totalMinutes = 0;
    const activeDatesThisWeek = new Set();

    allActivities.forEach(act => {
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

    // 6. Enriched Journeys List for Progress Page
    const journeysList = journeys.map(j => {
        const rep = j.report ? reportsMap.get(j.report.toString()) : null;
        const totalDays = j.roadmapDays || rep?.preparationPlan?.length || 15;
        const isComplete = j.status === "COMPLETED";
        const started = j.startedAt || j.createdAt || new Date();
        const completed = isComplete ? (j.completedAt || j.lastActivityAt || new Date()) : null;
        const elapsedDays = completed 
            ? Math.max(1, Math.ceil((new Date(completed) - new Date(started)) / (1000 * 60 * 60 * 24)))
            : Math.max(1, Math.ceil((new Date() - new Date(started)) / (1000 * 60 * 60 * 24)));

        return {
            id: j._id,
            reportId: j.report?._id || j.report,
            targetRole: j.targetRole,
            company: j.company,
            selectedTrack: j.selectedTrack,
            status: j.status,
            isCompleted: isComplete,
            roadmapDays: totalDays,
            completedDaysCount: j.completedDays?.length || 0,
            completedDays: j.completedDays || [],
            overallProgress: isComplete ? 100 : (j.overallProgress || 0),
            currentDay: j.currentDay,
            currentFocus: j.currentFocus,
            startedAt: started,
            completedAt: completed,
            elapsedCalendarDays: elapsedDays,
            activeLearningMinutes: j.totalActiveMinutes || Math.max(30, (j.completedDays?.length || 0) * 30),
            skillsGainedCount: skillsGained,
            achievementsCount: achievements.length,
            dayProgress: j.dayProgress || [],
            matchScore: rep?.matchScore || 0,
            practiceScores: {
                technical: 86,
                mcq: 82,
                behavioral: 78
            }
        };
    });

    // 7. Analyzer History (Top 5 reports with journey status)
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
        journeyStatus: journeyByReportId.get(r._id.toString()) || "NOT_STARTED",
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
            active: journeysActive,
            averageCompletion,
            journeysList
        },
        skills: {
            gained: skillsGained,
            skillsList: skillsList.slice(0, 25)
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
        recentActivities: allActivities.slice(0, 10)
    };
}

/**
 * Clear progress
 */
async function clearProgress(userId) {
    await Progress.deleteOne({ user: userId });
}

module.exports = {
    initProgress,
    updateStage,
    updateProgress,
    getProgress,
    clearProgress,
    getUserProgressSummary
};