const logger = require("./ai/logger");
const cacheService = require("./cache.service");
const { MODELS } = require("../config/ai.config");

const { createProgressTracker } = require("./ai/utils/progressTracker");
const { mergeInterviewReport } = require("./ai/utils/mergeInterviewReport");

const { analyzeResume } = require("./ai/generators/resumeAnalyzer");
const { generateTechnicalQuestions } = require("./ai/generators/technicalGenerator");
const { generateMcqQuestions } = require("./ai/generators/mcqGenerator");
const { generateBehavioralQuestions } = require("./ai/generators/behaviorGenerator");
const { generateSkillGap } = require("./ai/generators/skillGapGenerator");
const { generateRoadmap } = require("./ai/generators/roadmapGenerator");
const { analyzeAts } = require("./ai/generators/atsAnalyzer");
const { detectTracks } = require("./ai/generators/trackDetector");
const { generateResumePdfBuffer } = require("./ai/generators/resumePdfGenerator");

/**
 * Detect tracks/roles in a job description
 */
async function detectJobTracks({ jobDescription }) {
    const cacheKey = cacheService.buildKey("track-detection", jobDescription);
    return await cacheService.wrap(cacheKey, () => detectTracks({ jobDescription }));
}

/**
 * Generate full interview report with parallel Stage 2 and track support
 */
async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription,
    userId,
    selectedTrack,
    selectedTrackTitle
}) {
    const pipelineStartTime = Date.now();
    const tracker = userId ? createProgressTracker(userId) : null;

    try {
        // Stage 1: Resume Analysis
        await tracker?.advance("READING_RESUME");
        await tracker?.advance("RESUME_ANALYSIS");

        const resumeAnalysisKey = cacheService.buildKey(
            "resume-analysis", resume, selfDescription, jobDescription, selectedTrack || "", MODELS.PRIMARY
        );

        const resumeAnalysis = await cacheService.wrap(
            resumeAnalysisKey,
            () => analyzeResume({ resume, selfDescription, jobDescription, selectedTrack })
        );

        const summary = resumeAnalysis.summary;

        // Stage 2: Parallel generation (5 generators)
        const [
            technical,
            mcq,
            behavioral,
            skillGap,
            roadmap
        ] = await Promise.all([
            cacheService.wrap(
                cacheService.buildKey("technical", summary, jobDescription, selectedTrack || "", MODELS.FAST),
                () => generateTechnicalQuestions({ summary, jobDescription, selectedTrack })
            ).then(async (data) => {
                await tracker?.advance("TECHNICAL_QUESTIONS");
                return data;
            }),

            cacheService.wrap(
                cacheService.buildKey("mcq", summary, jobDescription, selectedTrack || "", MODELS.FAST),
                () => generateMcqQuestions({ summary, jobDescription, selectedTrack })
            ).then(async (data) => {
                await tracker?.advance("MCQ_QUESTIONS");
                return data;
            }),

            cacheService.wrap(
                cacheService.buildKey("behavioral", summary, MODELS.FAST),
                () => generateBehavioralQuestions({ summary })
            ).then(async (data) => {
                await tracker?.advance("BEHAVIORAL_QUESTIONS");
                return data;
            }),

            cacheService.wrap(
                cacheService.buildKey("skillgap", resume, summary, jobDescription, selectedTrack || "", MODELS.FAST),
                () => generateSkillGap({ resume, summary, jobDescription, selectedTrack })
            ).then(async (data) => {
                await tracker?.advance("SKILL_GAP_ANALYSIS");
                return data;
            }),

            cacheService.wrap(
                cacheService.buildKey("roadmap", summary, jobDescription, selectedTrack || "", MODELS.FAST),
                () => generateRoadmap({ summary, jobDescription, selectedTrack })
            ).then(async (data) => {
                await tracker?.advance("ROADMAP");
                return data;
            })
        ]);

        // Stage 3: Merge and finalize
        await tracker?.advance("FINALIZING_REPORT");

        const report = mergeInterviewReport({
            resumeAnalysis,
            technical,
            mcq,
            behavioral,
            skillGap,
            roadmap,
            atsAnalysis: null,
            selectedTrack,
            selectedTrackTitle,
            selectedTrackDetails: selectedTrack
        });

        await tracker?.advance("COMPLETED");

        const totalDurationSec = ((Date.now() - pipelineStartTime) / 1000).toFixed(2);
        console.log(`[AI] Report generation pipeline completed in ${totalDurationSec}s`);
        logger.info("Interview report generated", { durationSeconds: totalDurationSec });

        return { report, resumeAnalysis };

    } catch (err) {
        if (tracker) await tracker.advance("FAILED");
        const totalDurationSec = ((Date.now() - pipelineStartTime) / 1000).toFixed(2);
        console.error(`[AI] Pipeline failed after ${totalDurationSec}s: ${err.message}`);
        logger.error("Interview generation failed", { error: err.message, durationSeconds: totalDurationSec });
        throw err;
    }
}

/**
 * Generate ATS analysis on-demand or in background
 */
async function generateAtsReport({ resume, jobDescription, resumeAnalysis }) {
    const atsKey = cacheService.buildKey("ats", resume, jobDescription, MODELS.FAST);
    return await cacheService.wrap(atsKey, () => analyzeAts({ resume, jobDescription, resumeAnalysis }));
}

/**
 * Generate PDF buffer for resume
 */
async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    return await generateResumePdfBuffer({ resume, selfDescription, jobDescription });
}

module.exports = {
    detectJobTracks,
    generateInterviewReport,
    generateAtsReport,
    generateResumePdf
};