const progressService = require("../services/progress.service");

/**
 * GET /api/progress
 * Get interview generation progress (0-100%)
 */
async function getProgressController(req, res) {
    try {
        const userId = req.user.id;
        const progress = await progressService.getProgress(userId);
        return res.status(200).json(progress);
    } catch (err) {
        console.error("getProgressController error:", err);
        return res.status(500).json({ progress: 0, status: "IDLE" });
    }
}

/**
 * GET /api/progress/summary
 * Get aggregated student preparation metrics (Analyses, Journeys, Skills, Streaks, Time)
 */
async function getProgressSummaryController(req, res) {
    try {
        const userId = req.user.id;
        const timezone = req.query.timezone || "UTC";
        const summary = await progressService.getUserProgressSummary({ userId, timezone });
        return res.status(200).json(summary);
    } catch (err) {
        console.error("getProgressSummaryController error:", err);
        return res.status(500).json({
            message: "Failed to load progress summary",
            analyses: { total: 0, completed: 0, active: 0, notStarted: 0, averageMatchScore: 0 },
            journeys: { started: 0, completed: 0, active: 0 },
            skills: { gained: 0, skillsList: [] },
            streak: { current: 0, longest: 0, isActiveToday: false },
            learningTime: { todayMinutes: 0, weekMinutes: 0, totalMinutes: 0, activeDaysThisWeek: 0 }
        });
    }
}

module.exports = {
    getProgressController,
    getProgressSummaryController
};