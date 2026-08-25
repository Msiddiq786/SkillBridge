const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/detect-tracks
 * @description Detect multiple roles/tracks in a job description
 * @access private
 */
interviewRouter.post("/detect-tracks", authMiddleware.authUser, interviewController.detectTracksController);

/**
 * @route POST /api/interview/
 * @description Generate new interview report
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController);

/**
 * @route GET /api/interview/report/:interviewId
 * @description Get interview report by interviewId
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController);

/**
 * @route POST /api/interview/report/:interviewId/ats-retry
 * @description Retry or on-demand generate ATS analysis
 * @access private
 */
interviewRouter.post("/report/:interviewId/ats-retry", authMiddleware.authUser, interviewController.retryAtsAnalysisController);

/**
 * @route GET /api/interview/
 * @description Get all interview reports
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController);

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description Generate resume PDF
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController);

module.exports = interviewRouter;