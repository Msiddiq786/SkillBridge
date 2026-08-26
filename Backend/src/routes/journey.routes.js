const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const journeyController = require("../controllers/journey.controller");

const journeyRouter = express.Router();

/**
 * @route POST /api/journey/start
 * @description Start a new learning journey for a report
 * @access private
 */
journeyRouter.post("/start", authMiddleware.authUser, journeyController.startJourneyController);

/**
 * @route GET /api/journey/by-report/:reportId
 * @description Check if learning journey exists for report
 * @access private
 */
journeyRouter.get("/by-report/:reportId", authMiddleware.authUser, journeyController.getJourneyStatusController);

/**
 * @route GET /api/journey/dashboard
 * @description Get active learning journey, real streaks, and achievements
 * @access private
 */
journeyRouter.get("/dashboard", authMiddleware.authUser, journeyController.getDashboardJourneyController);

/**
 * @route POST /api/journey/:id/complete-day
 * @description Mark a roadmap day as complete
 * @access private
 */
journeyRouter.post("/:id/complete-day", authMiddleware.authUser, journeyController.completeDayController);

/**
 * @route PATCH /api/journey/:id/tasks
 * @description Update tasks checklist for a roadmap day
 * @access private
 */
journeyRouter.patch("/:id/tasks", authMiddleware.authUser, journeyController.updateTasksController);

/**
 * @route POST /api/journey/activity
 * @description Log user learning activity / active study minutes
 * @access private
 */
journeyRouter.post("/activity", authMiddleware.authUser, journeyController.recordActivityController);

/**
 * @route POST /api/journey/:id/switch
 * @description Switch primary active journey
 * @access private
 */
journeyRouter.post("/:id/switch", authMiddleware.authUser, journeyController.switchJourneyController);

/**
 * @route POST /api/journey/application
 * @description Update job application tracking state
 * @access private
 */
journeyRouter.post("/application", authMiddleware.authUser, journeyController.updateApplicationController);

/**
 * @route GET /api/journey/achievements/progression
 * @description Get dynamic achievement milestones and progression
 * @access private
 */
journeyRouter.get("/achievements/progression", authMiddleware.authUser, journeyController.getAchievementsProgressionController);

module.exports = journeyRouter;
