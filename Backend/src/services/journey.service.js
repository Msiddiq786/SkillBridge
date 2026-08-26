const mongoose = require("mongoose");
const LearningJourney = require("../models/learningJourney.model");
const LearningActivity = require("../models/learningActivity.model");
const Achievement = require("../models/achievement.model");
const JobApplication = require("../models/jobApplication.model");
const interviewReportModel = require("../models/interviewReport.model");
const PracticeSession = require("../models/practiceSession.model");
const ProfileModel = require("../models/profile.model");
const profileService = require("./profile.service");

// Standard predefined achievements
const PREDEFINED_ACHIEVEMENTS = {
    first_analysis: {
        id: "first_analysis",
        type: "ANALYSIS",
        category: "ANALYSIS",
        title: "First Step",
        description: "Completed your first job description and resume analysis.",
        icon: "🎯",
        targetValue: 1,
        unit: "analysis"
    },
    first_journey: {
        id: "first_journey",
        type: "JOURNEY",
        category: "LEARNING",
        title: "First Journey",
        description: "Started your first targeted learning journey.",
        icon: "🎯",
        targetValue: 1,
        unit: "journey"
    },
    first_day: {
        id: "first_day",
        type: "ROADMAP",
        category: "LEARNING",
        title: "First Day Complete",
        description: "Completed your first roadmap study day.",
        icon: "📚",
        targetValue: 1,
        unit: "day"
    },
    five_days: {
        id: "five_days",
        type: "ROADMAP",
        category: "LEARNING",
        title: "5 Days Complete",
        description: "Completed 5 days of structured roadmap learning.",
        icon: "🏆",
        targetValue: 5,
        unit: "days"
    },
    journey_master: {
        id: "journey_master",
        type: "JOURNEY",
        category: "LEARNING",
        title: "Journey Master",
        description: "Completed all roadmap days for a target role.",
        icon: "🎓",
        targetValue: 1,
        unit: "journey"
    },
    roadmap_finisher: {
        id: "roadmap_finisher",
        type: "ROADMAP",
        category: "LEARNING",
        title: "Roadmap Finisher",
        description: "Completed a full targeted preparation roadmap curriculum.",
        icon: "📚",
        targetValue: 1,
        unit: "curriculum"
    },
    streak_3: {
        id: "streak_3",
        type: "STREAK",
        category: "STREAK",
        title: "3 Day Streak",
        description: "Practiced and learned for 3 consecutive days.",
        icon: "🔥",
        targetValue: 3,
        unit: "days"
    },
    streak_7: {
        id: "streak_7",
        type: "STREAK",
        category: "STREAK",
        title: "7 Day Streak",
        description: "Maintained active learning for 7 consecutive days.",
        icon: "🔥",
        targetValue: 7,
        unit: "days"
    },
    streak_14: {
        id: "streak_14",
        type: "STREAK",
        category: "STREAK",
        title: "14 Day Streak",
        description: "Unstoppable! 14 consecutive days of active preparation.",
        icon: "⚡",
        targetValue: 14,
        unit: "days"
    },
    skill_builder: {
        id: "skill_builder",
        type: "SKILL",
        category: "SKILLS",
        title: "Skill Builder",
        description: "Gained verified evidence for 3 unique skills.",
        icon: "🧠",
        targetValue: 3,
        unit: "skills verified"
    },
    skill_master: {
        id: "skill_master",
        type: "SKILL",
        category: "SKILLS",
        title: "Skill Master",
        description: "Achieved strong mastery (>85%) in a target skill area.",
        icon: "🎯",
        targetValue: 1,
        unit: "mastered skill"
    },
    project_builder: {
        id: "project_builder",
        type: "PROFILE",
        category: "PROJECTS",
        title: "Project Builder",
        description: "Added 2 completed showcase projects with verified technologies.",
        icon: "🛠",
        targetValue: 2,
        unit: "projects"
    },
    voice_pioneer: {
        id: "voice_pioneer",
        type: "PRACTICE",
        category: "PRACTICE",
        title: "Voice Interview Pioneer",
        description: "Spoke and completed an interactive voice practice question.",
        icon: "🎙️",
        targetValue: 1,
        unit: "voice answer"
    },
    quiz_champion: {
        id: "quiz_champion",
        type: "PRACTICE",
        category: "PRACTICE",
        title: "MCQ Quiz Champion",
        description: "Completed an MCQ quiz practice session with high accuracy.",
        icon: "🧠",
        targetValue: 1,
        unit: "quiz"
    },
    star_storyteller: {
        id: "star_storyteller",
        type: "PRACTICE",
        category: "PRACTICE",
        title: "STAR Storyteller",
        description: "Completed behavioral practice using the STAR method.",
        icon: "🚀",
        targetValue: 1,
        unit: "STAR session"
    },
    interview_ready: {
        id: "interview_ready",
        type: "PRACTICE",
        category: "PRACTICE",
        title: "Interview Ready",
        description: "Completed a full mock interview session.",
        icon: "🎤",
        targetValue: 1,
        unit: "mock interview"
    },
    interview_practiced: {
        id: "interview_practiced",
        type: "PRACTICE",
        category: "PRACTICE",
        title: "Interview Practiced",
        description: "Completed 5 mock practice sessions.",
        icon: "🎙️",
        targetValue: 5,
        unit: "sessions"
    },
    resume_builder: {
        id: "resume_builder",
        type: "RESUME",
        category: "RESUME",
        title: "Resume Builder",
        description: "Generated your first AI-tailored role resume.",
        icon: "📄",
        targetValue: 1,
        unit: "resume"
    },
    application_ready_resume: {
        id: "application_ready_resume",
        type: "RESUME",
        category: "RESUME",
        title: "Application Ready",
        description: "Created a verified JD-ready resume for submission.",
        icon: "🚀",
        targetValue: 1,
        unit: "JD-ready resume"
    },
    first_application: {
        id: "first_application",
        type: "APPLICATION",
        category: "APPLICATIONS",
        title: "First Application",
        description: "Created and tracked your first job application.",
        icon: "💼",
        targetValue: 1,
        unit: "application"
    },
    offer_ready: {
        id: "offer_ready",
        type: "APPLICATION",
        category: "APPLICATIONS",
        title: "Offer Ready",
        description: "Progressed an application to offer status or complete readiness.",
        icon: "🏆",
        targetValue: 1,
        unit: "offer"
    },
    jd_ready: {
        id: "jd_ready",
        type: "READINESS",
        category: "APPLICATIONS",
        title: "JD Ready",
        description: "Achieved >= 75% overall JD readiness for your target role.",
        icon: "✅",
        targetValue: 1,
        unit: "readiness"
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
        const isAlreadyComplete = journey.status === "COMPLETED" || (journey.completedDays && journey.completedDays.length >= daysCount && daysCount > 0) || journey.overallProgress === 100;
        if (isAlreadyComplete) {
            journey.status = "COMPLETED";
            journey.overallProgress = 100;
            if (!journey.completedAt) journey.completedAt = journey.lastActivityAt || new Date();
        } else {
            journey.status = "ACTIVE";
        }
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
        journey.completedAt = journey.completedAt || new Date();
        journey.overallProgress = 100;
        await unlockAchievement(userId, "journey_master");
        await unlockAchievement(userId, "roadmap_finisher");
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

    // 8. Other journeys for switcher with populated report for accurate matchScores
    const otherJourneys = await LearningJourney.find({ user: userId })
        .sort({ updatedAt: -1 })
        .populate("report");

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
            isPrimary: j.isPrimary,
            matchScore: j.report?.matchScore || 0,
            reportId: j.report?._id || j.report
        })),
        application
    };
}

/**
 * Switch Active Primary Journey
 */
async function switchPrimaryJourney({ userId, journeyId }) {
    await LearningJourney.updateMany({ user: userId }, { isPrimary: false });
    const targetJourney = await LearningJourney.findOne({ _id: journeyId, user: userId });
    if (!targetJourney) throw new Error("Learning journey not found");

    targetJourney.isPrimary = true;
    if (targetJourney.status !== "COMPLETED") {
        targetJourney.status = "ACTIVE";
    }
    await targetJourney.save();
    return targetJourney;
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

/**
 * Get dynamic achievement milestones progression for career hub
 */
async function getAchievementProgression(userId, timezone = "UTC") {
    const [
        achievements,
        reports,
        journeys,
        profile,
        completedSessions,
        applications,
        streaks
    ] = await Promise.all([
        Achievement.find({ user: userId }),
        interviewReportModel.find({ user: userId }),
        LearningJourney.find({ user: userId }),
        ProfileModel.findOne({ user: userId }),
        PracticeSession.find({ user: userId, status: "COMPLETED" }),
        JobApplication.find({ user: userId }),
        calculateStreaks(userId, timezone)
    ]);

    const unlockedMap = new Map();
    achievements.forEach(a => unlockedMap.set(a.achievementId, a));

    // Calculate real dynamic metric values
    const reportsCount = reports.length;
    const journeysCount = journeys.length;
    const completedJourneysCount = journeys.filter(j => j.status === "COMPLETED").length;
    const totalCompletedDays = journeys.reduce((sum, j) => sum + (j.completedDays?.length || 0), 0);

    // Verified skills
    const verifiedSkillsSet = new Set();
    if (profile?.skills) {
        profile.skills.forEach(s => {
            if (s && s.name && (s.evidenceType === "VERIFIED" || s.source === "Resume" || s.source === "Project")) {
                verifiedSkillsSet.add(s.name.trim().toLowerCase());
            }
        });
    }
    const verifiedSkillsCount = verifiedSkillsSet.size;

    // Completed Projects
    const profileCompletedProjects = (profile?.projects || []).filter(p => p.status === "Completed").length;
    let reportCompletedProjects = 0;
    reports.forEach(r => {
        if (Array.isArray(r.recommendedProjects)) {
            reportCompletedProjects += r.recommendedProjects.filter(p => p.status === "COMPLETED").length;
        }
    });
    const completedProjectsCount = Math.max(profileCompletedProjects, reportCompletedProjects);

    // Practice counts & types
    let voiceCount = 0;
    let mcqCount = 0;
    let starCount = 0;
    let mockInterviewCount = 0;
    let hasMasteredSkill = false;

    completedSessions.forEach(s => {
        if (s.planType === "MIXED") mockInterviewCount++;
        if (s.planType === "MCQ") mcqCount++;
        if (s.planType === "BEHAVIORAL") starCount++;
        if (Array.isArray(s.answers)) {
            s.answers.forEach(ans => {
                if (ans.isVoice) voiceCount++;
            });
        }
        if (Array.isArray(s.topicPerformance)) {
            if (s.topicPerformance.some(tp => tp.score >= 85)) {
                hasMasteredSkill = true;
            }
        }
    });

    const applicationsCount = applications.length;
    const offersCount = applications.filter(a => a.status === "OFFER").length;
    const hasJdReady = reports.some(r => (r.matchScore || 0) >= 75) || journeys.some(j => (j.overallProgress || 0) >= 75);

    // Auto-unlock achievements if conditions met and not yet recorded
    const milestones = await Promise.all(Object.values(PREDEFINED_ACHIEVEMENTS).map(async (def) => {
        let currentProgress = 0;

        switch (def.id) {
            case "first_analysis":
                currentProgress = Math.min(def.targetValue, reportsCount);
                break;
            case "first_journey":
                currentProgress = Math.min(def.targetValue, journeysCount);
                break;
            case "first_day":
                currentProgress = Math.min(def.targetValue, totalCompletedDays);
                break;
            case "five_days":
                currentProgress = Math.min(def.targetValue, totalCompletedDays);
                break;
            case "journey_master":
            case "roadmap_finisher":
                currentProgress = Math.min(def.targetValue, completedJourneysCount);
                break;
            case "streak_3":
                currentProgress = Math.min(def.targetValue, streaks.currentStreak);
                break;
            case "streak_7":
                currentProgress = Math.min(def.targetValue, streaks.currentStreak);
                break;
            case "streak_14":
                currentProgress = Math.min(def.targetValue, streaks.currentStreak);
                break;
            case "skill_builder":
                currentProgress = Math.min(def.targetValue, verifiedSkillsCount);
                break;
            case "skill_master":
                currentProgress = hasMasteredSkill ? 1 : 0;
                break;
            case "project_builder":
                currentProgress = Math.min(def.targetValue, completedProjectsCount);
                break;
            case "voice_pioneer":
                currentProgress = Math.min(def.targetValue, voiceCount);
                break;
            case "quiz_champion":
                currentProgress = Math.min(def.targetValue, mcqCount);
                break;
            case "star_storyteller":
                currentProgress = Math.min(def.targetValue, starCount);
                break;
            case "interview_ready":
                currentProgress = Math.min(def.targetValue, mockInterviewCount);
                break;
            case "interview_practiced":
                currentProgress = Math.min(def.targetValue, completedSessions.length);
                break;
            case "resume_builder":
                currentProgress = reportsCount > 0 ? 1 : 0;
                break;
            case "application_ready_resume":
                currentProgress = hasJdReady ? 1 : 0;
                break;
            case "first_application":
                currentProgress = Math.min(def.targetValue, applicationsCount);
                break;
            case "offer_ready":
                currentProgress = Math.min(def.targetValue, offersCount);
                break;
            case "jd_ready":
                currentProgress = hasJdReady ? 1 : 0;
                break;
            default:
                currentProgress = 0;
        }

        let isUnlocked = unlockedMap.has(def.id);
        let unlockedAt = isUnlocked ? unlockedMap.get(def.id).unlockedAt : null;

        // Auto-persist unlock if qualifying target reached
        if (!isUnlocked && currentProgress >= def.targetValue && def.targetValue > 0) {
            try {
                const unlocked = await unlockAchievement(userId, def.id);
                if (unlocked) {
                    isUnlocked = true;
                    unlockedAt = unlocked.unlockedAt;
                }
            } catch (e) {
                // Ignore unique race condition
            }
        }

        const progressPercent = def.targetValue > 0
            ? Math.min(100, Math.round((currentProgress / def.targetValue) * 100))
            : (isUnlocked ? 100 : 0);

        const remainingCount = Math.max(0, def.targetValue - currentProgress);
        let evidenceText = "";
        let requirementText = def.description;
        let actionLink = "/";
        let actionLabel = "View";

        switch (def.id) {
            case "first_analysis":
                evidenceText = reportsCount > 0 ? `Analyzed ${reports[0]?.title || "Target Role"} at ${reports[0]?.company || "Company"}` : "";
                requirementText = "Analyze at least 1 job description and resume.";
                actionLink = "/";
                actionLabel = "Analyze Job";
                break;
            case "first_journey":
                evidenceText = journeysCount > 0 ? `Started ${journeys[0]?.targetRole || "Target Role"} Journey` : "";
                requirementText = "Start your first targeted learning journey.";
                actionLink = "/dashboard";
                actionLabel = "View Journey";
                break;
            case "first_day":
                evidenceText = totalCompletedDays > 0 ? "Completed Day 1 of structured roadmap" : "";
                requirementText = "Complete Day 1 of any learning roadmap.";
                actionLink = "/dashboard";
                actionLabel = "Continue Roadmap";
                break;
            case "five_days":
                evidenceText = totalCompletedDays >= 5 ? `Completed ${totalCompletedDays} roadmap days` : "";
                requirementText = "Complete at least 5 roadmap learning days.";
                actionLink = "/dashboard";
                actionLabel = "Continue Roadmap";
                break;
            case "roadmap_finisher":
            case "journey_master":
                evidenceText = completedJourneysCount > 0 ? `Completed 100% of ${journeys.find(j => j.status === "COMPLETED")?.targetRole || "Roadmap"}` : "";
                requirementText = "Complete all days of a target role preparation roadmap.";
                actionLink = "/progress";
                actionLabel = "View Progress";
                break;
            case "streak_3":
            case "streak_7":
            case "streak_14":
                evidenceText = streaks.currentStreak >= def.targetValue ? `${streaks.currentStreak}-day active learning streak` : "";
                requirementText = `Maintain active qualifying preparation for ${def.targetValue} consecutive days.`;
                actionLink = "/dashboard";
                actionLabel = "Learn Today";
                break;
            case "skill_builder":
            case "skill_expert":
                evidenceText = verifiedSkillsCount > 0 ? `Verified ${verifiedSkillsCount} skills with evidence` : "";
                requirementText = `Verify at least ${def.targetValue} unique skills through projects, resume, or practice.`;
                actionLink = "/profile";
                actionLabel = "View Skills";
                break;
            case "skill_master":
                evidenceText = hasMasteredSkill ? "Scored >= 85% topic mastery in practice" : "";
                requirementText = "Score 85% or higher in any technical topic during practice.";
                actionLink = "/practice";
                actionLabel = "Practice Questions";
                break;
            case "project_builder":
            case "project_architect":
                evidenceText = completedProjectsCount > 0 ? `Completed ${completedProjectsCount} showcase projects` : "";
                requirementText = `Add ${def.targetValue} completed showcase projects with verified tech stack.`;
                actionLink = "/profile";
                actionLabel = "Manage Projects";
                break;
            case "voice_pioneer":
                evidenceText = voiceCount > 0 ? "Completed voice-recorded practice response" : "";
                requirementText = "Answer at least 1 practice question using voice speech.";
                actionLink = "/practice";
                actionLabel = "Voice Practice";
                break;
            case "quiz_champion":
                evidenceText = mcqCount > 0 ? "Scored high accuracy in MCQ technical quiz" : "";
                requirementText = "Complete an MCQ practice quiz session.";
                actionLink = "/practice";
                actionLabel = "Take Quiz";
                break;
            case "star_storyteller":
                evidenceText = starCount > 0 ? "Completed behavioral interview with STAR method" : "";
                requirementText = "Complete a behavioral interview session using STAR framework.";
                actionLink = "/practice";
                actionLabel = "Practice Behavioral";
                break;
            case "interview_ready":
                evidenceText = mockInterviewCount > 0 ? "Completed full mixed mock interview" : "";
                requirementText = "Complete a comprehensive mock interview session.";
                actionLink = "/practice";
                actionLabel = "Start Mock";
                break;
            case "interview_practiced":
                evidenceText = completedSessions.length >= 5 ? `Completed ${completedSessions.length} practice sessions` : "";
                requirementText = "Complete 5 mock interview or practice sessions.";
                actionLink = "/practice";
                actionLabel = "Practice Hub";
                break;
            case "resume_builder":
                evidenceText = reportsCount > 0 ? "Generated tailored role resume" : "";
                requirementText = "Generate a tailored AI resume for a target job.";
                actionLink = "/readiness";
                actionLabel = "View Resume";
                break;
            case "application_ready_resume":
            case "jd_ready":
                evidenceText = hasJdReady ? "Achieved >= 75% target role readiness" : "";
                requirementText = "Reach 75% or higher overall readiness for a target position.";
                actionLink = "/readiness";
                actionLabel = "Check Readiness";
                break;
            case "first_application":
            case "offer_ready":
                evidenceText = applicationsCount > 0 ? `Tracked ${applicationsCount} job applications` : "";
                requirementText = "Track a job application in the Application Tracker.";
                actionLink = "/applications";
                actionLabel = "Track Job";
                break;
            default:
                break;
        }

        return {
            id: def.id,
            type: def.type,
            category: def.category || "LEARNING",
            title: def.title,
            description: def.description,
            icon: def.icon || "🏆",
            targetValue: def.targetValue || 1,
            currentProgress,
            unit: def.unit || "progress",
            progressPercent,
            isUnlocked,
            unlockedAt,
            evidence: evidenceText,
            requirement: requirementText,
            remainingCount,
            actionLink,
            actionLabel
        };
    }));

    const unlockedCount = milestones.filter(m => m.isUnlocked).length;
    const totalCount = milestones.length;
    const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

    return {
        summary: {
            unlockedCount,
            totalCount,
            completionPercentage,
            currentStreak: streaks.currentStreak
        },
        milestones
    };
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
    getAchievementProgression,
    PREDEFINED_ACHIEVEMENTS
};
