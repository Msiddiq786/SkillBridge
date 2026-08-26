const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getProgressController, getProgressSummaryController } = require("../controllers/progress.controller");

const router = express.Router();

/**
 * GET /api/progress
 * Returns current interview generation progress
 */
router.get(
    "/",
    authMiddleware.authUser,
    getProgressController
);

/**
 * GET /api/progress/summary
 * Returns aggregated learning, analyzer, streak, and skill statistics
 */
router.get(
    "/summary",
    authMiddleware.authUser,
    getProgressSummaryController
);

module.exports = router;