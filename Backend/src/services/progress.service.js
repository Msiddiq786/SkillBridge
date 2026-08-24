const Progress = require("../models/progress.model");

/**
 * Update progress for a user
 */
async function updateProgress(userId, progress, status = "IN_PROGRESS") {

    return await Progress.findOneAndUpdate(
        { user: userId },
        {
            progress,
            status,
            updatedAt: new Date()
        },
        {
            upsert: true,
            returnDocument: "after",
            setDefaultsOnInsert: true
        }
    );

}

/**
 * Get current progress
 */
async function getProgress(userId) {

    const progress = await Progress.findOne({ user: userId });

    if (!progress) {
        return {
            progress: 0,
            status: "IDLE"
        };
    }

    return progress;
}

/**
 * Reset progress after completion
 */
async function clearProgress(userId) {

    await Progress.deleteOne({
        user: userId
    });

}

module.exports = {

    updateProgress,

    getProgress,

    clearProgress

};