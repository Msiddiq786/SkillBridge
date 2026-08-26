const readinessService = require("../services/readiness.service");

/**
 * GET /api/readiness
 * GET /api/readiness/:reportId
 * Return grounded readiness evaluation for the candidate
 */
async function getReadinessController(req, res) {
    try {
        const userId = req.user.id;
        const { reportId } = req.params;

        const data = await readinessService.getReadinessForReport({
            userId,
            reportId: reportId || req.query.reportId || null
        });

        return res.status(200).json(data);
    } catch (err) {
        console.error("getReadinessController error:", err);
        return res.status(500).json({
            hasReport: false,
            message: "Failed to evaluate application readiness: " + err.message
        });
    }
}

module.exports = {
    getReadinessController
};
