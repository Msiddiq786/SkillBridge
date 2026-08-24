const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const progressService = require("../services/progress.service");

const router = express.Router();

/**
 * GET /api/progress
 * Returns current interview generation progress
 */
router.get(
    "/",
    authMiddleware.authUser,
    async (req, res) => {
        try {
            const progress = await progressService.getProgress(req.user.id);
            return res.status(200).json(progress);
        } catch (err) {
            console.error("Progress fetch error:", err);
            return res.status(500).json({
                progress: 0,
                status: "IDLE"
            });
        }
    }
);

module.exports = router;