const progressService = require("../../progress.service");

function createProgressTracker(userId) {
    return {
        async init() {
            if (!userId) return;
            await progressService.initProgress(userId);
        },

        async advance(stageName, state = "COMPLETED", customStatus = null) {
            if (!userId) return;
            return await progressService.updateStage(userId, stageName, state, customStatus);
        },

        async fail(stageName = null) {
            if (!userId) return;
            return await progressService.updateStage(userId, stageName || "FAILED", "FAILED", "Failed");
        }
    };
}

module.exports = { createProgressTracker };