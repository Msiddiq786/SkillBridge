const profileService = require("../services/profile.service");

/**
 * GET /api/profile
 * Get authenticated student's profile
 */
async function getProfileController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const result = await profileService.getProfileByUserId(userId);
        return res.status(200).json(result);
    } catch (err) {
        console.error("getProfileController error:", err);
        return res.status(500).json({ message: err.message || "Failed to load student profile" });
    }
}

/**
 * PUT /api/profile
 * Update student's profile
 */
async function updateProfileController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const result = await profileService.updateProfileByUserId(userId, req.body);
        return res.status(200).json({
            message: "Profile updated successfully",
            profile: result.profile,
            completionPercentage: result.completionPercentage,
            missingChecklist: result.missingChecklist
        });
    } catch (err) {
        console.error("updateProfileController error:", err);
        return res.status(500).json({ message: err.message || "Failed to update profile" });
    }
}

module.exports = {
    getProfileController,
    updateProfileController
};
