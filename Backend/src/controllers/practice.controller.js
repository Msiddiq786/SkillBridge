const practiceService = require("../services/practice.service");

/**
 * Start or retrieve an existing in-progress practice session
 * POST /api/practice/start
 */
async function startPracticeSessionController(req, res) {
    try {
        const { interviewReportId, mode } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!interviewReportId || !mode) {
            return res.status(400).json({ message: "interviewReportId and mode are required" });
        }

        const result = await practiceService.startOrGetPracticeSession({
            userId,
            interviewReportId,
            mode
        });

        return res.status(200).json({
            message: "Practice session initialized",
            session: result.session,
            report: result.report,
            attemptedCount: result.attemptedCount,
            requiredCount: result.requiredCount,
            remainingCount: result.remainingCount
        });
    } catch (err) {
        console.error("startPracticeSessionController error:", err);
        return res.status(500).json({ message: err.message || "Failed to start practice session" });
    }
}

/**
 * Get practice session details
 * GET /api/practice/:id
 */
async function getPracticeSessionController(req, res) {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id || req.user?._id;

        const result = await practiceService.getPracticeSessionById({
            userId,
            sessionId
        });

        return res.status(200).json({
            session: result.session,
            report: result.report,
            attemptedCount: result.attemptedCount,
            requiredCount: result.requiredCount,
            remainingCount: result.remainingCount,
            isCompleted: result.isCompleted
        });
    } catch (err) {
        console.error("getPracticeSessionController error:", err);
        return res.status(404).json({ message: err.message || "Practice session not found" });
    }
}

/**
 * Update practice session progress
 * PATCH /api/practice/:id/progress
 */
async function updateProgressController(req, res) {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id || req.user?._id;
        const { progressData, timeSpentDelta } = req.body;

        const session = await practiceService.updateProgress({
            userId,
            sessionId,
            progressData: progressData || {},
            timeSpentDelta: timeSpentDelta || 0
        });

        return res.status(200).json({
            message: "Progress updated",
            session
        });
    } catch (err) {
        console.error("updateProgressController error:", err);
        return res.status(500).json({ message: err.message || "Failed to update progress" });
    }
}

/**
 * Submit an answer for a question
 * POST /api/practice/:id/answer
 */
async function submitAnswerController(req, res) {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id || req.user?._id;
        const answerData = req.body;

        const session = await practiceService.submitAnswer({
            userId,
            sessionId,
            answerData
        });

        return res.status(200).json({
            message: "Answer submitted",
            session
        });
    } catch (err) {
        console.error("submitAnswerController error:", err);
        return res.status(500).json({ message: err.message || "Failed to submit answer" });
    }
}

/**
 * On-demand AI evaluation of user's written answer
 * POST /api/practice/evaluate
 */
async function evaluateAnswerController(req, res) {
    try {
        const { questionType, questionData, userAnswer } = req.body;

        if (!questionType || !questionData || !userAnswer) {
            return res.status(400).json({ message: "questionType, questionData, and userAnswer are required" });
        }

        const evaluation = await practiceService.evaluateUserAnswer({
            questionType,
            questionData,
            userAnswer
        });

        return res.status(200).json({
            message: "Answer evaluated successfully",
            evaluation
        });
    } catch (err) {
        console.error("evaluateAnswerController error:", err);
        return res.status(500).json({ message: err.message || "Answer evaluation is temporarily unavailable." });
    }
}

/**
 * Complete a practice session
 * POST /api/practice/:id/complete
 */
async function completeSessionController(req, res) {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id || req.user?._id;

        const result = await practiceService.completeSession({
            userId,
            sessionId
        });

        // Record qualifying learning activity for streaks and achievements
        try {
            const journeyService = require("../services/journey.service");
            const modeName = result.session?.mode || "Practice";
            const timeMins = Math.max(5, Math.round((result.session?.timeSpentSeconds || 0) / 60));
            const timezone = req.query.timezone || req.headers["x-timezone"] || "UTC";

            await journeyService.recordActivity({
                userId,
                activityType: "PRACTICE_COMPLETED",
                title: `Completed ${modeName.toUpperCase()} Practice (${result.session?.overallScore || 0}% Score)`,
                detail: `Mode: ${modeName}, Time: ${timeMins} min`,
                isQualifying: true,
                activeMinutes: timeMins,
                timezone
            });

            // Practice achievements
            if (modeName === "technical" || modeName === "mixed") {
                await journeyService.unlockAchievement(userId, "voice_pioneer");
            }
            if (modeName === "mcq" && (result.session?.overallScore || 0) >= 70) {
                await journeyService.unlockAchievement(userId, "quiz_champion");
            }
            if (modeName === "behavioral" || modeName === "mixed") {
                await journeyService.unlockAchievement(userId, "star_storyteller");
            }
        } catch (actErr) {
            console.warn("[Practice] Activity logging skipped:", actErr.message);
        }

        return res.status(200).json({
            message: "Session completed",
            session: result.session,
            report: result.report
        });
    } catch (err) {
        console.error("completeSessionController error:", err);
        const status = err.statusCode || 500;
        return res.status(status).json({
            message: err.message || "Failed to complete practice session",
            attemptedCount: err.attemptedCount,
            requiredCount: err.requiredCount,
            remainingCount: err.remainingCount
        });
    }
}

/**
 * Get results and weak topics for a session
 * GET /api/practice/:id/results
 */
async function getResultsController(req, res) {
    try {
        const sessionId = req.params.id;
        const userId = req.user?.id || req.user?._id;

        const result = await practiceService.getPracticeSessionById({
            userId,
            sessionId
        });

        return res.status(200).json({
            session: result.session,
            report: result.report,
            weakTopics: result.session.weakTopics,
            topicPerformance: result.session.topicPerformance,
            overallScore: result.session.overallScore
        });
    } catch (err) {
        console.error("getResultsController error:", err);
        return res.status(404).json({ message: err.message || "Results not found" });
    }
}

/**
 * Get aggregate practice stats for dashboard
 * GET /api/practice/stats
 */
async function getPracticeStatsController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        const stats = await practiceService.getUserPracticeStats({ userId });

        return res.status(200).json({ stats });
    } catch (err) {
        console.error("getPracticeStatsController error:", err);
        return res.status(500).json({ message: err.message || "Failed to retrieve practice stats" });
    }
}

module.exports = {
    startPracticeSessionController,
    getPracticeSessionController,
    updateProgressController,
    submitAnswerController,
    evaluateAnswerController,
    completeSessionController,
    getResultsController,
    getPracticeStatsController
};
