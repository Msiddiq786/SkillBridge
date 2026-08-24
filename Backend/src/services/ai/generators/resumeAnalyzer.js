const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { resumeAnalysisSchema } = require("../schemas");
const { buildResumeAnalysisPrompt } = require("../prompts/resume.prompt");
const { enforceSkillConsistency } = require("../utils/skillConsistency");

async function analyzeResume({ resume, selfDescription, jobDescription, selectedTrack }) {
    const prompt = buildResumeAnalysisPrompt({ resume, selfDescription, jobDescription, selectedTrack });

    const rawResponse = await generateJson({
        model: MODELS.PRIMARY,
        contents: prompt,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumeAnalysisSchema)
        }
    });

    // Enforce single source of truth across all derived arrays and summaries
    return enforceSkillConsistency(rawResponse);
}

module.exports = { analyzeResume };