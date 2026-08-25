const logger = require("./ai/logger");
const cacheService = require("./cache.service");
const { MODELS, DEFAULT_PLAN_CONFIG } = require("../config/ai.config");

const { createProgressTracker } = require("./ai/utils/progressTracker");
const { mergeInterviewReport } = require("./ai/utils/mergeInterviewReport");

const { analyzeResume } = require("./ai/generators/resumeAnalyzer");
const { generateTechnicalQuestions } = require("./ai/generators/technicalGenerator");
const { generateMcqQuestions } = require("./ai/generators/mcqGenerator");
const { generateBehavioralQuestions } = require("./ai/generators/behaviorGenerator");
const { generateSkillGap } = require("./ai/generators/skillGapGenerator");
const { generateRoadmap } = require("./ai/generators/roadmapGenerator");
const { generateProjectRecommendations } = require("./ai/generators/projectGenerator");
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
 * Generate full interview report with parallel Stage 2, user-customized planConfig, and track support
 */
async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription,
    userId,
    selectedTrack,
    selectedTrackTitle,
    planConfig
}) {
    const pipelineStartTime = Date.now();
    const tracker = userId ? createProgressTracker(userId) : null;

    // Merge provided planConfig with defaults to ensure complete config
    const effectivePlanConfig = {
        ...DEFAULT_PLAN_CONFIG,
        ...(planConfig || {}),
        technicalDifficulty: {
            ...DEFAULT_PLAN_CONFIG.technicalDifficulty,
            ...(planConfig?.technicalDifficulty || {})
        },
        mcqDifficulty: {
            ...DEFAULT_PLAN_CONFIG.mcqDifficulty,
            ...(planConfig?.mcqDifficulty || {})
        },
        behavioralDifficulty: {
            ...DEFAULT_PLAN_CONFIG.behavioralDifficulty,
            ...(planConfig?.behavioralDifficulty || {})
        }
    };

    try {
        // Phase 1: Resume Analysis (0 -> 15%)
        await tracker?.init();
        await tracker?.advance("readingResume", "COMPLETED");

        const resumeAnalysisKey = cacheService.buildKey(
            "resume-analysis", resume, selfDescription, jobDescription, selectedTrack || "", MODELS.PRIMARY
        );

        const resumeAnalysis = await cacheService.wrap(
            resumeAnalysisKey,
            () => analyzeResume({ resume, selfDescription, jobDescription, selectedTrack })
        );

        await tracker?.advance("resumeAnalysis", "COMPLETED");

        const summary = resumeAnalysis.summary;

        // Phase 2: Parallel Content Generation (15 -> 65%, concurrent tasks for enabled modes)
        const [
            technical,
            mcq,
            behavioral,
            skillGap,
            projectRecommendations
        ] = await Promise.all([
            effectivePlanConfig.includeTechnical && effectivePlanConfig.technicalCount > 0
                ? cacheService.wrap(
                    cacheService.buildKey("technical", summary, jobDescription, selectedTrack || "", JSON.stringify(effectivePlanConfig), MODELS.FAST),
                    () => generateTechnicalQuestions({ summary, jobDescription, selectedTrack, planConfig: effectivePlanConfig })
                ).then(async (data) => {
                    await tracker?.advance("technical", "COMPLETED");
                    return data;
                })
                : Promise.resolve({ technicalQuestions: [] }).then(async (data) => {
                    await tracker?.advance("technical", "COMPLETED");
                    return data;
                }),

            effectivePlanConfig.includeMCQ && effectivePlanConfig.mcqCount > 0
                ? cacheService.wrap(
                    cacheService.buildKey("mcq", summary, jobDescription, selectedTrack || "", JSON.stringify(effectivePlanConfig), MODELS.FAST),
                    () => generateMcqQuestions({ summary, jobDescription, selectedTrack, planConfig: effectivePlanConfig })
                ).then(async (data) => {
                    await tracker?.advance("mcq", "COMPLETED");
                    return data;
                })
                : Promise.resolve({ mcqQuestions: [] }).then(async (data) => {
                    await tracker?.advance("mcq", "COMPLETED");
                    return data;
                }),

            effectivePlanConfig.includeBehavioral && effectivePlanConfig.behavioralCount > 0
                ? cacheService.wrap(
                    cacheService.buildKey("behavioral", resume, summary, selfDescription || "", JSON.stringify(effectivePlanConfig), MODELS.FAST),
                    () => generateBehavioralQuestions({ resume, summary, selfDescription, planConfig: effectivePlanConfig })
                ).then(async (data) => {
                    await tracker?.advance("behavioral", "COMPLETED");
                    return data;
                })
                : Promise.resolve({ behavioralQuestions: [] }).then(async (data) => {
                    await tracker?.advance("behavioral", "COMPLETED");
                    return data;
                }),

            cacheService.wrap(
                cacheService.buildKey("skillgap", resume, summary, jobDescription, selectedTrack || "", JSON.stringify(resumeAnalysis.skillClassification || []), MODELS.FAST),
                () => generateSkillGap({ resume, summary, jobDescription, selectedTrack, skillClassification: resumeAnalysis.skillClassification })
            ).then(async (data) => {
                await tracker?.advance("skillGap", "COMPLETED");
                return data;
            }),

            cacheService.wrap(
                cacheService.buildKey("projects", resume, summary, jobDescription, selectedTrack || "", selectedTrackTitle || resumeAnalysis.title || "", JSON.stringify(resumeAnalysis.skillClassification || []), MODELS.FAST),
                () => generateProjectRecommendations({
                    resume,
                    selfDescription,
                    jobDescription,
                    selectedTrack,
                    skillClassification: resumeAnalysis.skillClassification,
                    summary,
                    targetRole: selectedTrackTitle || selectedTrack || resumeAnalysis.title || "Target Role",
                    company: resumeAnalysis.company || ""
                })
            )
        ]);

        // Phase 3: Building Roadmap (65 -> 85%)
        await tracker?.advance("roadmap", "IN_PROGRESS");
        const roadmap = await cacheService.wrap(
            cacheService.buildKey("roadmap", resume, summary, jobDescription, selectedTrack || "", JSON.stringify(resumeAnalysis.skillClassification || []), JSON.stringify(effectivePlanConfig), MODELS.FAST),
            () => generateRoadmap({ resume, summary, jobDescription, selectedTrack, skillClassification: resumeAnalysis.skillClassification, planConfig: effectivePlanConfig })
        );
        await tracker?.advance("roadmap", "COMPLETED");

        // Phase 4: Finalizing and Merging Report (85 -> 95%)
        await tracker?.advance("finalizing", "IN_PROGRESS");

        const report = mergeInterviewReport({
            resumeAnalysis,
            technical,
            mcq,
            behavioral,
            skillGap,
            roadmap,
            atsAnalysis: null,
            projectRecommendations,
            selectedTrack,
            selectedTrackTitle,
            selectedTrackDetails: selectedTrack,
            planConfig: effectivePlanConfig
        });

        await tracker?.advance("finalizing", "COMPLETED");

        // Phase 5: Completed (100%)
        await tracker?.advance("COMPLETED");

        const totalDurationSec = ((Date.now() - pipelineStartTime) / 1000).toFixed(2);
        console.log(`[AI] Report generation pipeline completed in ${totalDurationSec}s`);
        logger.info("Interview report generated", { durationSeconds: totalDurationSec });

        return { report, resumeAnalysis };

    } catch (err) {
        if (tracker) await tracker.fail();
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