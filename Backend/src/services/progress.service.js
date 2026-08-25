const Progress = require("../models/progress.model");

// In-memory per-user async mutex to guarantee atomic sequencing of parallel completions
const userLocks = new Map();

function withUserLock(userId, fn) {
    const key = String(userId);
    const prevPromise = userLocks.get(key) || Promise.resolve();
    const currentPromise = prevPromise.then(async () => {
        try {
            return await fn();
        } finally {
            if (userLocks.get(key) === currentPromise) {
                userLocks.delete(key);
            }
        }
    });
    userLocks.set(key, currentPromise);
    return currentPromise;
}

/**
 * Initialize a new generation progress record
 */
async function initProgress(userId) {
    return withUserLock(userId, async () => {
        return await Progress.findOneAndUpdate(
            { user: userId },
            {
                progress: 0,
                status: "Reading Resume",
                stage: "READING_RESUME",
                stages: {
                    readingResume: "IN_PROGRESS",
                    resumeAnalysis: "PENDING",
                    technical: "PENDING",
                    mcq: "PENDING",
                    behavioral: "PENDING",
                    skillGap: "PENDING",
                    roadmap: "PENDING",
                    finalizing: "PENDING"
                },
                updatedAt: new Date()
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
    });
}

/**
 * Update a specific stage with monotonic progress guarantees and race-condition safety
 */
async function updateStage(userId, stageName, stageState = "COMPLETED", customStatusText = null) {
    return withUserLock(userId, async () => {
        let doc = await Progress.findOne({ user: userId });
        if (!doc) {
            doc = new Progress({
                user: userId,
                progress: 0,
                status: "Reading Resume",
                stage: "READING_RESUME"
            });
        }

        if (stageName && doc.stages && doc.stages[stageName] !== undefined) {
            doc.stages[stageName] = stageState;
        }

        let calculatedProgress = 0;
        let statusText = customStatusText || doc.status;

        // Phase 1: Resume Analysis (0 -> 15%)
        if (doc.stages.readingResume === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 5);
            if (!customStatusText) statusText = "Analyzing Resume";
        }
        if (doc.stages.resumeAnalysis === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 15);
            if (!customStatusText) statusText = "Generating Interview Content";
        }

        // Phase 2: Parallel Content Generation (15 -> 65%, 4 tasks @ 12.5% each)
        const parallelKeys = ["technical", "mcq", "behavioral", "skillGap"];
        const completedParallelCount = parallelKeys.filter(k => doc.stages[k] === "COMPLETED").length;
        
        if (doc.stages.resumeAnalysis === "COMPLETED") {
            const parallelIncrement = Math.round(completedParallelCount * 12.5); // 0, 13, 25, 38, 50
            calculatedProgress = Math.max(calculatedProgress, 15 + parallelIncrement);
        }

        // Phase 3: Roadmap (65 -> 85%)
        if (doc.stages.roadmap === "IN_PROGRESS") {
            calculatedProgress = Math.max(calculatedProgress, 65);
            if (!customStatusText) statusText = "Building Roadmap";
        } else if (doc.stages.roadmap === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 85);
            if (!customStatusText) statusText = "Finalizing Report";
        }

        // Phase 4: Finalizing (85 -> 95%)
        if (doc.stages.finalizing === "IN_PROGRESS" || doc.stages.finalizing === "COMPLETED") {
            calculatedProgress = Math.max(calculatedProgress, 95);
            if (!customStatusText) statusText = "Finalizing Report";
        }

        // Phase 5: Completed (100%)
        if (stageName === "COMPLETED" || doc.status === "Completed") {
            calculatedProgress = 100;
            statusText = "Completed";
        }

        // Failure State: Keep last confirmed percentage, do NOT reset to 0
        if (stageState === "FAILED" || stageName === "FAILED") {
            statusText = "Failed";
        }

        // STRICT MONOTONIC RULE: newProgress is always >= previousProgress
        const finalProgress = Math.max(doc.progress || 0, calculatedProgress);

        doc.progress = finalProgress;
        doc.status = statusText;
        doc.stage = stageName || doc.stage;
        doc.updatedAt = new Date();

        await doc.save();
        return doc;
    });
}

/**
 * Direct progress update with monotonic safety
 */
async function updateProgress(userId, progress, status = "IN_PROGRESS") {
    return withUserLock(userId, async () => {
        let doc = await Progress.findOne({ user: userId });
        if (!doc) {
            doc = new Progress({ user: userId });
        }

        const finalProgress = Math.max(doc.progress || 0, progress);
        doc.progress = finalProgress;
        doc.status = status;
        doc.updatedAt = new Date();

        await doc.save();
        return doc;
    });
}

/**
 * Get current generation progress
 */
async function getProgress(userId) {
    const progress = await Progress.findOne({ user: userId });
    if (!progress) {
        return {
            progress: 0,
            status: "IDLE",
            stage: "START",
            stages: {
                readingResume: "PENDING",
                resumeAnalysis: "PENDING",
                technical: "PENDING",
                mcq: "PENDING",
                behavioral: "PENDING",
                skillGap: "PENDING",
                roadmap: "PENDING",
                finalizing: "PENDING"
            }
        };
    }
    return progress;
}

/**
 * Clear progress
 */
async function clearProgress(userId) {
    await Progress.deleteOne({ user: userId });
}

module.exports = {
    initProgress,
    updateStage,
    updateProgress,
    getProgress,
    clearProgress
};