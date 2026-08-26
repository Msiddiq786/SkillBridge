const journeyService = require("../services/journey.service");

/**
 * Start Learning Journey
 * POST /api/journey/start
 */
async function startJourneyController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const { reportId, timezone } = req.body;

        if (!reportId) {
            return res.status(400).json({ message: "reportId is required" });
        }

        const journey = await journeyService.startJourney({
            userId,
            reportId,
            timezone: timezone || "UTC"
        });

        return res.status(200).json({
            message: "Learning journey started successfully",
            journey
        });
    } catch (err) {
        console.error("startJourneyController error:", err);
        return res.status(500).json({ message: err.message || "Failed to start learning journey" });
    }
}

/**
 * Get Journey Status by Report ID
 * GET /api/journey/by-report/:reportId
 */
async function getJourneyStatusController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const { reportId } = req.params;

        const result = await journeyService.getJourneyStatus({
            userId,
            reportId
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error("getJourneyStatusController error:", err);
        return res.status(500).json({ message: err.message || "Failed to get journey status" });
    }
}

/**
 * Get Active Dashboard Data
 * GET /api/journey/dashboard
 */
async function getDashboardJourneyController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const timezone = req.query.timezone || req.headers["x-timezone"] || "UTC";

        const data = await journeyService.getActiveDashboardData({
            userId,
            timezone
        });

        return res.status(200).json(data);
    } catch (err) {
        console.error("getDashboardJourneyController error:", err);
        return res.status(500).json({ message: err.message || "Failed to load dashboard data" });
    }
}

/**
 * Complete a Roadmap Day
 * POST /api/journey/:id/complete-day
 */
async function completeDayController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const journeyId = req.params.id;
        const { dayNumber, taskIndices, timezone } = req.body;

        if (!dayNumber) {
            return res.status(400).json({ message: "dayNumber is required" });
        }

        const result = await journeyService.completeRoadmapDay({
            userId,
            journeyId,
            dayNumber: parseInt(dayNumber),
            taskIndices: taskIndices || [],
            timezone: timezone || "UTC"
        });

        return res.status(200).json({
            message: `Day ${dayNumber} completed!`,
            ...result
        });
    } catch (err) {
        console.error("completeDayController error:", err);
        return res.status(500).json({ message: err.message || "Failed to complete roadmap day" });
    }
}

/**
 * Update tasks for a day
 * PATCH /api/journey/:id/tasks
 */
async function updateTasksController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const journeyId = req.params.id;
        const { dayNumber, completedTasks, timezone } = req.body;

        const result = await journeyService.updateRoadmapDayTasks({
            userId,
            journeyId,
            dayNumber: parseInt(dayNumber),
            completedTasks: completedTasks || [],
            timezone: timezone || "UTC"
        });

        return res.status(200).json({
            message: "Tasks updated",
            ...result
        });
    } catch (err) {
        console.error("updateTasksController error:", err);
        return res.status(500).json({ message: err.message || "Failed to update tasks" });
    }
}

/**
 * Record a general learning activity
 * POST /api/journey/activity
 */
async function recordActivityController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const { journeyId, activityType, title, detail, isQualifying, activeMinutes, metadata, timezone } = req.body;

        if (!activityType || !title) {
            return res.status(400).json({ message: "activityType and title are required" });
        }

        const result = await journeyService.recordActivity({
            userId,
            journeyId,
            activityType,
            title,
            detail,
            isQualifying: Boolean(isQualifying),
            activeMinutes: parseInt(activeMinutes || 0),
            metadata,
            timezone: timezone || "UTC"
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error("recordActivityController error:", err);
        return res.status(500).json({ message: err.message || "Failed to record activity" });
    }
}

/**
 * Switch Active Journey
 * POST /api/journey/:id/switch
 */
async function switchJourneyController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const journeyId = req.params.id;

        const updated = await journeyService.switchPrimaryJourney({
            userId,
            journeyId
        });

        return res.status(200).json({
            message: "Switched active journey",
            journey: updated
        });
    } catch (err) {
        console.error("switchJourneyController error:", err);
        return res.status(500).json({ message: err.message || "Failed to switch journey" });
    }
}

/**
 * Update Job Application Status
 * POST /api/journey/application
 */
async function updateApplicationController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const { journeyId, status, jobUrl, notes } = req.body;

        if (!journeyId) {
            return res.status(400).json({ message: "journeyId is required" });
        }

        const app = await journeyService.updateApplicationStatus({
            userId,
            journeyId,
            status,
            jobUrl,
            notes
        });

        return res.status(200).json({
            message: "Application status updated",
            application: app
        });
    } catch (err) {
        console.error("updateApplicationController error:", err);
        return res.status(500).json({ message: err.message || "Failed to update application" });
    }
}

/**
 * Get Achievement Milestones Progression
 * GET /api/journey/achievements/progression
 */
async function getAchievementsProgressionController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const timezone = req.query.timezone || req.headers["x-timezone"] || "UTC";
        const data = await journeyService.getAchievementProgression(userId, timezone);
        return res.status(200).json(data);
    } catch (err) {
        console.error("getAchievementsProgressionController error:", err);
        return res.status(500).json({ message: err.message || "Failed to load achievements progression" });
    }
}

module.exports = {
    startJourneyController,
    getJourneyStatusController,
    getDashboardJourneyController,
    completeDayController,
    updateTasksController,
    recordActivityController,
    switchJourneyController,
    updateApplicationController,
    getAchievementsProgressionController
};
