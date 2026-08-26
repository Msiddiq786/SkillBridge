const applicationService = require("../services/application.service");

/**
 * GET /api/applications
 * List user applications with filters & summary
 */
async function getAllApplicationsController(req, res) {
    try {
        const userId = req.user.id;
        const { status, search, sort } = req.query;
        const data = await applicationService.getAllApplications(userId, { status, search, sort });
        return res.status(200).json(data);
    } catch (err) {
        console.error("getAllApplicationsController error:", err);
        return res.status(500).json({ message: "Failed to load applications: " + err.message });
    }
}

/**
 * GET /api/applications/:id
 * Get single application by ID
 */
async function getApplicationByIdController(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const application = await applicationService.getApplicationById(userId, id);
        return res.status(200).json(application);
    } catch (err) {
        console.error("getApplicationByIdController error:", err);
        return res.status(404).json({ message: err.message });
    }
}

/**
 * POST /api/applications
 * Create or track application
 */
async function createApplicationController(req, res) {
    try {
        const userId = req.user.id;
        const application = await applicationService.createOrTrackApplication(userId, req.body);
        return res.status(201).json(application);
    } catch (err) {
        console.error("createApplicationController error:", err);
        return res.status(500).json({ message: "Failed to track application: " + err.message });
    }
}

/**
 * PATCH /api/applications/:id
 * Update application status / timeline / notes
 */
async function updateApplicationController(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updated = await applicationService.updateApplication(userId, id, req.body);
        return res.status(200).json(updated);
    } catch (err) {
        console.error("updateApplicationController error:", err);
        return res.status(500).json({ message: "Failed to update application: " + err.message });
    }
}

/**
 * DELETE /api/applications/:id
 * Delete application
 */
async function deleteApplicationController(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await applicationService.deleteApplication(userId, id);
        return res.status(200).json({ message: "Application deleted successfully" });
    } catch (err) {
        console.error("deleteApplicationController error:", err);
        return res.status(404).json({ message: err.message });
    }
}

module.exports = {
    getAllApplicationsController,
    getApplicationByIdController,
    createApplicationController,
    updateApplicationController,
    deleteApplicationController
};
