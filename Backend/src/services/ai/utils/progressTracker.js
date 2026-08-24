const progressService = require("../../progress.service");

const STAGES = {
    READING_RESUME: { progress: 5, status: "Reading Resume" },
    RESUME_ANALYSIS: { progress: 12, status: "Analyzing Resume" },
    TECHNICAL_QUESTIONS: { progress: 28, status: "Generating Technical Questions" },
    MCQ_QUESTIONS: { progress: 40, status: "Generating MCQ Questions" },
    BEHAVIORAL_QUESTIONS: { progress: 52, status: "Generating Behavioral Questions" },
    SKILL_GAP_ANALYSIS: { progress: 65, status: "Analyzing Skill Gaps" },
    ROADMAP: { progress: 80, status: "Building Roadmap" },
    FINALIZING_REPORT: { progress: 95, status: "Finalizing Report" },
    COMPLETED: { progress: 100, status: "Completed" },
    FAILED: { progress: 0, status: "Failed" }
};

function createProgressTracker(userId) {
    return {
        async advance(stage) {
            const current = STAGES[stage];
            if (!current) return;
            await progressService.updateProgress(userId, current.progress, current.status);
        }
    };
}

module.exports = { STAGES, createProgressTracker };