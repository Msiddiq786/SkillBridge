const mongoose = require("mongoose");
const LearningJourney = require("../models/learningJourney.model");
const LearningActivity = require("../models/learningActivity.model");
const Achievement = require("../models/achievement.model");
const JobApplication = require("../models/jobApplication.model");
const interviewReportModel = require("../models/interviewReport.model");
const PracticeSession = require("../models/practiceSession.model");
const profileService = require("./profile.service");

// Standard predefined achievements
const PREDEFINED_ACHIEVEMENTS = {
    first_journey: {
        id: "first_journey",
        type: "JOURNEY",
        title: "First Journey",
        description: "Started your first targeted learning journey.",
        icon: "🎯"
    },
    first_day: {
        id: "first_day",
        type: "ROADMAP",
        title: "First Day Complete",
        description: "Completed your first roadmap study day.",
        icon: "📚"
    },
    five_days: {
        id: "five_days",
        type: "ROADMAP",
        title: "5 Days Complete",
        description: "Completed 5 days of structured roadmap learning.",
        icon: "🏆"
    },
    journey_master: {
        id: "journey_master",
        type: "JOURNEY",
        title: "Journey Master",
        description: "Completed all roadmap days for a target role.",
        icon: "🎓"
    },
    streak_3: {
        id: "streak_3",
        type: "STREAK",
        title: "3 Day Streak",
        description: "Practiced and learned for 3 consecutive days.",
        icon: "🔥"
    },
    streak_7: {
        id: "streak_7",
        type: "STREAK",
        title: "7 Day Streak",
        description: "Maintained active learning for 7 consecutive days.",
        icon: "🔥"
    },
    streak_14: {
        id: "streak_14",
        type: "STREAK",
        title: "14 Day Streak",
        description: "Unstoppable! 14 consecutive days of active preparation.",
        icon: "⚡"
    },
    voice_pioneer: {
        id: "voice_pioneer",
        type: "PRACTICE",
        title: "Voice Interview Pioneer",
        description: "Spoke and completed an interactive voice practice question.",
        icon: "🎙️"
    },
    quiz_champion: {
        id: "quiz_champion",
        type: "PRACTICE",
        title: "MCQ Quiz Champion",
        description: "Completed an MCQ quiz practice session with high accuracy.",
        icon: "🧠"
    },
    star_storyteller: {
        id: "star_storyteller",
        type: "PRACTICE",
        title: "STAR Storyteller",
        description: "Completed behavioral practice using the STAR method.",
        icon: "🚀"
    },
    project_builder: {
        id: "project_builder",
        type: "PROFILE",
        title: "Project Builder",
        description: "Added showcase projects with verified technologies.",
        icon: "🛠"
    },
    jd_ready: {
        id: "jd_ready",
        type: "READINESS",
        title: "JD Ready",
        description: "Achieved >= 75% overall JD readiness for your target role.",
        icon: "✅"
    }
};

/**
 * Get YYYY-MM-DD in user's timezone
 */
function getLocalDateString(date = new Date(), timezone = "UTC") {
    try {
        const d = new Date(date);
        const options = { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" };
        const formatter = new Intl.DateTimeFormat("en-CA", options); // en-CA gives YYYY-MM-DD
        return formatter.format(d);
    } catch {
        return new Date(date).toISOString().split("T")[0];
    }
}

/**
 * Unlock an achievement for user if not already unlocked
 */
async function unlockAchievement(userId, achievementId, metadata = {}) {
    const def = PREDEFINED_ACHIEVEMENTS[achievementId];
    if (!def) return null;

    try {
        const existing = await Achievement.findOne({ user: userId, achievementId });
        if (existing) return existing;

        const created = await Achievement.create({
            user: userId,
            achievementId,
            type: def.type,
            title: def.title,
            description: def.description,
            icon: def.icon,
            metadata
        });
        return created;
    } catch (err) {
        if (err.code === 11000) {
            return await Achievement.findOne({ user: userId, achievementId });
        }
        console.error("unlockAchievement error:", err);
        return null;
    }
}

/**
 * Calculate user's current and longest streak based on real qualifying activity days
 */
async function calculateStreaks(userId, timezone = "UTC") {
    const qualifyingActivities = await LearningActivity.find({
        user: userId,
        isQualifying: true
    }).sort({ dateString: 1 });

    if (!qualifyingActivities || qualifyingActivities.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            lastQualifyingDate: null,
            isActiveToday: false
        };
    }

    const uniqueDates = Array.from(new Set(qualifyingActivities.map(a => a.dateString))).sort();
    const todayStr = getLocalDateString(new Date(), timezone);

    // Calculate yesterday's date string
    const todayDate = new Date();
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterdayDate, timezone);

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
    const isActiveToday = lastDate === todayStr;

    if (lastDate === todayStr || lastDate === yesterdayStr) {
        // Count backwards from lastDate for current streak
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

    // Check streak achievements
    if (currentStreak >= 3) await unlockAchievement(userId, "streak_3");
    if (currentStreak >= 7) await unlockAchievement(userId, "streak_7");
    if (currentStreak >= 14) await unlockAchievement(userId, "streak_14");

    return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        lastQualifyingDate: lastDate,
        isActiveToday
    };
}

/**
 * Start or Activate a Learning Journey for an Interview Report
 */
async function startJourney({ userId, reportId, timezone = "UTC" }) {
    const report = await interviewReportModel.findOne({ _id: reportId, user: userId });
    if (!report) {
        throw new Error("Interview report not found or unauthorized");
    }

    // Mark previous journeys as not primary
    await LearningJourney.updateMany({ user: userId }, { isPrimary: false });

    let journey = await LearningJourney.findOne({ user: userId, report: reportId });
    const daysCount = report.preparationPlan?.length || report.planConfig?.roadmapDays || 15;

    if (!journey) {
        // Initialize day progress
        const initialDayProgress = (report.preparationPlan || []).map(day => ({
            day: day.day,
            status: day.day === 1 ? "IN_PROGRESS" : "NOT_STARTED",
            completedTasks: [],
            startedAt: day.day === 1 ? new Date() : undefined
        }));

        journey = await LearningJourney.create({
            user: userId,
            report: reportId,
            targetRole: report.selectedTrackTitle || report.selectedTrack || report.title || "Target Role",
            company: report.company || "",
            selectedTrack: report.selectedTrackTitle || report.selectedTrack || "",
            roadmapDays: daysCount,
            currentDay: 1,
            completedDays: [],
            dayProgress: initialDayProgress,
            overallProgress: 0,
            currentFocus: report.preparationPlan?.[0]?.focus || "Day 1 Fundamentals",
            status: "ACTIVE",
            isPrimary: true,
            startedAt: new Date(),
            lastActivityAt: new Date()
        });

        // Award First Journey achievement
        await unlockAchievement(userId, "first_journey");
    } else {
        journey.status = "ACTIVE";
        journey.isPrimary = true;
        journey.lastActivityAt = new Date();
        await journey.save();
    }

    const dateStr = getLocalDateString(new Date(), timezone);
    await LearningActivity.create({
        user: userId,
        journey: journey._id,
        dateString: dateStr,
        activityType: "STUDY_TIME",
        title: `Started Preparation: ${journey.targetRole}`,
        detail: `Target Company: ${journey.company || "General"}`,
        isQualifying: false
    });

    return journey;
}

/**
 * Get Journey status for a specific report
 */
async function getJourneyStatus({ userId, reportId }) {
    const journey = await LearningJourney.findOne({ user: userId, report: reportId });
    return {
        hasJourney: Boolean(journey),
        journey: journey || null
    };
}

/**
 * Mark a Roadmap Day as Complete
 */
async function completeRoadmapDay({ userId, journeyId, dayNumber, taskIndices = [], timezone = "UTC" }) {
    const journey = await LearningJourney.findOne({ _id: journeyId, user: userId });
    if (!journey) {
        throw new Error("Learning journey not found");
    }

    const report = await interviewReportModel.findById(journey.report);
    const totalDays = journey.roadmapDays || report?.preparationPlan?.length || 15;

    // Add to completedDays if not present
    if (!journey.completedDays.includes(dayNumber)) {
        journey.completedDays.push(dayNumber);
        journey.completedDays.sort((a, b) => a - b);
    }

    // Update dayProgress entry
    let dayProg = journey.dayProgress.find(d => d.day === dayNumber);
    if (!dayProg) {
        dayProg = { day: dayNumber, status: "COMPLETED", completedTasks: taskIndices, completedAt: new Date() };
        journey.dayProgress.push(dayProg);
    } else {
        dayProg.status = "COMPLETED";
        dayProg.completedTasks = taskIndices;
        dayProg.completedAt = new Date();
    }

    // Advance currentDay if completing current
    if (dayNumber >= journey.currentDay && dayNumber < totalDays) {
        journey.currentDay = dayNumber + 1;
        // Update next day to in progress
        let nextDayProg = journey.dayProgress.find(d => d.day === dayNumber + 1);
        if (nextDayProg) {
            nextDayProg.status = "IN_PROGRESS";
            nextDayProg.startedAt = new Date();
        }
    }

    // Update focus
    const currentDayObj = report?.preparationPlan?.find(p => p.day === journey.currentDay);
    if (currentDayObj) {
        journey.currentFocus = currentDayObj.focus;
    }

    journey.overallProgress = Math.min(100, Math.round((journey.completedDays.length / totalDays) * 100));
    journey.lastActivityAt = new Date();

    if (journey.completedDays.length >= totalDays) {
        journey.status = "COMPLETED";
        journey.completedAt = new Date();
        await unlockAchievement(userId, "journey_master");
    }

    await journey.save();

    // Record QUALIFYING activity for streak!
    const dateStr = getLocalDateString(new Date(), timezone);
    await LearningActivity.create({
        user: userId,
        journey: journey._id,
        dateString: dateStr,
        activityType: "DAY_COMPLETED",
        title: `Completed Day ${dayNumber}: ${currentDayObj?.focus || "Roadmap Day"}`,
        detail: `Progress: ${journey.overallProgress}% (${journey.completedDays.length}/${totalDays} days)`,
        isQualifying: true,
        activeMinutes: 30
    });

    // Check Day-based Achievements
    if (journey.completedDays.length >= 1) {
        await unlockAchievement(userId, "first_day");
    }
    if (journey.completedDays.length >= 5) {
        await unlockAchievement(userId, "five_days");
    }

    const streaks = await calculateStreaks(userId, timezone);

    return {
        journey,
        streaks,
        completedDaysCount: journey.completedDays.length,
        totalDays
    };
}

/**
 * Update task checklist for a roadmap day
 */
async function updateRoadmapDayTasks({ userId, journeyId, dayNumber, completedTasks, timezone = "UTC" }) {
    const journey = await LearningJourney.findOne({ _id: journeyId, user: userId });
    if (!journey) throw new Error("Learning journey not found");

    let dayProg = journey.dayProgress.find(d => d.day === dayNumber);
    if (!dayProg) {
        dayProg = { day: dayNumber, status: "IN_PROGRESS", completedTasks: completedTasks || [], startedAt: new Date() };
        journey.dayProgress.push(dayProg);
    } else {
        dayProg.completedTasks = completedTasks || [];
        if (dayProg.status === "NOT_STARTED") {
            dayProg.status = "IN_PROGRESS";
            dayProg.startedAt = new Date();
        }
    }

    journey.lastActivityAt = new Date();
    await journey.save();

    // Record qualifying activity if at least 1 task checked
    if (completedTasks && completedTasks.length > 0) {
        const dateStr = getLocalDateString(new Date(), timezone);
        await LearningActivity.create({
            user: userId,
            journey: journey._id,
            dateString: dateStr,
            activityType: "TASK_COMPLETED",
            title: `Completed tasks on Day ${dayNumber}`,
            detail: `${completedTasks.length} task(s) finished`,
            isQualifying: true,
            activeMinutes: 15
        });
    }

    const streaks = await calculateStreaks(userId, timezone);
    return { journey, streaks };
}

/**
 * Record a general learning activity
 */
async function recordActivity({ userId, journeyId, activityType, title, detail, isQualifying = false, activeMinutes = 0, metadata = {}, timezone = "UTC" }) {
    const dateStr = getLocalDateString(new Date(), timezone);

    const activity = await LearningActivity.create({
        user: userId,
        journey: journeyId || undefined,
        dateString: dateStr,
        activityType,
        title,
        detail: detail || "",
        isQualifying,
        activeMinutes,
        metadata
    });

    if (journeyId && activeMinutes > 0) {
        await LearningJourney.findByIdAndUpdate(journeyId, {
            $inc: { totalActiveMinutes: activeMinutes },
            lastActivityAt: new Date()
        });
    }

    const streaks = isQualifying ? await calculateStreaks(userId, timezone) : null;
    return { activity, streaks };
}

/**
 * Track user login (non-qualifying, streaks do NOT increase on login alone)
 */
async function logUserLogin({ userId, timezone = "UTC" }) {
    const dateStr = getLocalDateString(new Date(), timezone);

    // Only record one login activity per day to avoid clutter
    const existing = await LearningActivity.findOne({
        user: userId,
        dateString: dateStr,
        activityType: "LOGIN"
    });

    if (!existing) {
        await LearningActivity.create({
            user: userId,
            dateString: dateStr,
            activityType: "LOGIN",
            title: "Logged in to StudentSkillHub",
            isQualifying: false,
            activeMinutes: 0
        });
    }
}

/**
 * Get Comprehensive Dashboard Data
 */
async function getActiveDashboardData({ userId, timezone = "UTC" }) {
    // 1. Find primary active journey
    let primaryJourney = await LearningJourney.findOne({ user: userId, isPrimary: true, status: { $in: ["ACTIVE", "COMPLETED"] } })
        .populate("report");

    if (!primaryJourney) {
        // Fallback: any active journey
        primaryJourney = await LearningJourney.findOne({ user: userId, status: "ACTIVE" })
            .sort({ updatedAt: -1 })
            .populate("report");
    }

    // 2. Streaks from real qualifying activity
    const streaks = await calculateStreaks(userId, timezone);

    // 3. User achievements
    const achievements = await Achievement.find({ user: userId }).sort({ unlockedAt: -1 });

    // 4. Learning activities (last 14 days)
    const recentActivities = await LearningActivity.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);

    // 5. Compute Active Learning Time
    const allActivities = await LearningActivity.find({ user: userId, activeMinutes: { $gt: 0 } });
    const todayStr = getLocalDateString(new Date(), timezone);

    let totalActiveMinutes = 0;
    let todayMinutes = 0;
    let weekMinutes = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo, timezone);

    allActivities.forEach(a => {
        const mins = a.activeMinutes || 0;
        totalActiveMinutes += mins;
        if (a.dateString === todayStr) {
            todayMinutes += mins;
        }
        if (a.dateString >= sevenDaysAgoStr) {
            weekMinutes += mins;
        }
    });

    // 6. Practice score average
    const completedPracticeSessions = await PracticeSession.find({
        user: userId,
        status: "COMPLETED"
    });

    let avgPracticeScore = 0;
    if (completedPracticeSessions.length > 0) {
        const total = completedPracticeSessions.reduce((sum, s) => sum + (s.overallScore || 0), 0);
        avgPracticeScore = Math.round(total / completedPracticeSessions.length);
    }

    // 7. Profile completeness
    const profileResult = await profileService.getProfileByUserId(userId);
    const profileScore = profileResult?.completionPercentage || 0;

    // 8. Other journeys for switcher
    const otherJourneys = await LearningJourney.find({ user: userId }).sort({ updatedAt: -1 });

    // 9. Job Application Status
    let application = null;
    if (primaryJourney) {
        application = await JobApplication.findOne({ user: userId, journey: primaryJourney._id });
    }

    // Compute JD Readiness
    let jdReadiness = 0;
    if (primaryJourney?.report) {
        const matchScore = primaryJourney.report.matchScore || 50;
        const roadmapProgress = primaryJourney.overallProgress || 0;
        const practiceFactor = avgPracticeScore > 0 ? avgPracticeScore : matchScore;
        jdReadiness = Math.min(100, Math.round((matchScore * 0.4) + (roadmapProgress * 0.4) + (practiceFactor * 0.2)));

        if (jdReadiness >= 75) {
            await unlockAchievement(userId, "jd_ready");
        }
    }

    // All available achievements with locked/unlocked state
    const allAchievementsCatalog = Object.values(PREDEFINED_ACHIEVEMENTS).map(item => {
        const found = achievements.find(a => a.achievementId === item.id);
        return {
            ...item,
            isUnlocked: Boolean(found),
            unlockedAt: found ? found.unlockedAt : null
        };
    });

    return {
        hasActiveJourney: Boolean(primaryJourney),
        primaryJourney: primaryJourney ? {
            _id: primaryJourney._id,
            targetRole: primaryJourney.targetRole,
            company: primaryJourney.company,
            selectedTrack: primaryJourney.selectedTrack,
            roadmapDays: primaryJourney.roadmapDays,
            currentDay: primaryJourney.currentDay,
            completedDays: primaryJourney.completedDays || [],
            overallProgress: primaryJourney.overallProgress || 0,
            currentFocus: primaryJourney.currentFocus,
            status: primaryJourney.status,
            startedAt: primaryJourney.startedAt,
            completedAt: primaryJourney.completedAt,
            dayProgress: primaryJourney.dayProgress,
            reportId: primaryJourney.report?._id || primaryJourney.report,
            matchScore: primaryJourney.report?.matchScore || 0,
            preparationPlan: primaryJourney.report?.preparationPlan || []
        } : null,
        streaks,
        timeStats: {
            todayMinutes,
            weekMinutes,
            totalMinutes: totalActiveMinutes
        },
        readiness: {
            jdReadiness,
            interviewPracticeScore: avgPracticeScore,
            profileScore
        },
        achievements: allAchievementsCatalog,
        unlockedCount: achievements.length,
        recentActivities,
        otherJourneys: otherJourneys.map(j => ({
            _id: j._id,
            targetRole: j.targetRole,
            company: j.company,
            status: j.status,
            overallProgress: j.overallProgress,
            currentDay: j.currentDay,
            roadmapDays: j.roadmapDays,
            isPrimary: j.isPrimary
        })),
        application
    };
}

/**
 * Switch Active Primary Journey
 */
async function switchPrimaryJourney({ userId, journeyId }) {
    await LearningJourney.updateMany({ user: userId }, { isPrimary: false });
    const updated = await LearningJourney.findOneAndUpdate(
        { _id: journeyId, user: userId },
        { isPrimary: true, status: "ACTIVE" },
        { new: true }
    );
    return updated;
}

/**
 * Update Job Application Status
 */
async function updateApplicationStatus({ userId, journeyId, status, jobUrl, notes }) {
    const journey = await LearningJourney.findOne({ _id: journeyId, user: userId });
    if (!journey) throw new Error("Learning journey not found");

    let app = await JobApplication.findOne({ user: userId, journey: journeyId });
    if (!app) {
        app = new JobApplication({
            user: userId,
            journey: journeyId,
            report: journey.report,
            targetRole: journey.targetRole,
            company: journey.company || "Target Company"
        });
    }

    app.status = status || app.status;
    if (jobUrl !== undefined) app.jobUrl = jobUrl;
    if (notes !== undefined) app.notes = notes;
    if (status === "APPLIED" && !app.appliedAt) {
        app.appliedAt = new Date();
    }

    await app.save();
    return app;
}

module.exports = {
    startJourney,
    getJourneyStatus,
    completeRoadmapDay,
    updateRoadmapDayTasks,
    recordActivity,
    logUserLogin,
    getActiveDashboardData,
    switchPrimaryJourney,
    updateApplicationStatus,
    calculateStreaks,
    unlockAchievement,
    PREDEFINED_ACHIEVEMENTS
};
