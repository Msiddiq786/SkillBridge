const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const practiceController = require("../controllers/practice.controller");

const practiceRouter = express.Router();

/**
 * @route POST /api/practice/start
 * @description Start or get in-progress practice session
 * @access Private
 */
practiceRouter.post("/start", authMiddleware.authUser, practiceController.startPracticeSessionController);

/**
 * @route GET /api/practice/stats
 * @description Get user aggregate practice stats
 * @access Private
 */
practiceRouter.get("/stats", authMiddleware.authUser, practiceController.getPracticeStatsController);

/**
 * @route POST /api/practice/evaluate
 * @description On-demand AI answer evaluation
 * @access Private
 */
practiceRouter.post("/evaluate", authMiddleware.authUser, practiceController.evaluateAnswerController);

/**
 * @route GET /api/practice/:id
 * @description Get practice session details
 * @access Private
 */
practiceRouter.get("/:id", authMiddleware.authUser, practiceController.getPracticeSessionController);

/**
 * @route PATCH /api/practice/:id/progress
 * @description Update practice progress
 * @access Private
 */
practiceRouter.patch("/:id/progress", authMiddleware.authUser, practiceController.updateProgressController);

/**
 * @route POST /api/practice/:id/answer
 * @description Submit single question answer
 * @access Private
 */
practiceRouter.post("/:id/answer", authMiddleware.authUser, practiceController.submitAnswerController);

/**
 * @route POST /api/practice/:id/complete
 * @description Mark session complete & compute analytics
 * @access Private
 */
practiceRouter.post("/:id/complete", authMiddleware.authUser, practiceController.completeSessionController);

/**
 * @route GET /api/practice/:id/results
 * @description Get session results and weak topics
 * @access Private
 */
practiceRouter.get("/:id/results", authMiddleware.authUser, practiceController.getResultsController);

module.exports = practiceRouter;
