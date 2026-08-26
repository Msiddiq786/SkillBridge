const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const {
    getAllApplicationsController,
    getApplicationByIdController,
    createApplicationController,
    updateApplicationController,
    deleteApplicationController
} = require("../controllers/application.controller");

const router = express.Router();

router.use(authMiddleware.authUser);

/**
 * @route GET /api/applications
 * @description List user's job applications
 */
router.get("/", getAllApplicationsController);

/**
 * @route POST /api/applications
 * @description Track new job application
 */
router.post("/", createApplicationController);

/**
 * @route GET /api/applications/:id
 * @description Get single application details and timeline
 */
router.get("/:id", getApplicationByIdController);

/**
 * @route PATCH /api/applications/:id
 * @description Update application status, timeline, notes
 */
router.patch("/:id", updateApplicationController);

/**
 * @route DELETE /api/applications/:id
 * @description Remove tracked application
 */
router.delete("/:id", deleteApplicationController);

module.exports = router;
