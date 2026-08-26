const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getReadinessController } = require("../controllers/readiness.controller");

const router = express.Router();

/**
 * @route GET /api/readiness
 * @description Get readiness evaluation for primary/latest report
 * @access private
 */
router.get("/", authMiddleware.authUser, getReadinessController);

/**
 * @route GET /api/readiness/:reportId
 * @description Get readiness evaluation for specific report
 * @access private
 */
router.get("/:reportId", authMiddleware.authUser, getReadinessController);

module.exports = router;
