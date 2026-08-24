const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { atsAnalysisSchema } = require("../schemas");
const { buildAtsAnalysisPrompt } = require("../prompts/ats.prompt");

/**
 * Stage 5
 * Generate ATS Analysis using FAST model
 */
async function analyzeAts({
    resume,
    jobDescription,
    resumeAnalysis
}) {

    const prompt = buildAtsAnalysisPrompt({
        resume,
        jobDescription,
        resumeAnalysis
    });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(atsAnalysisSchema)
        }
    });

    return {
        atsAnalysis: response
    };

}

module.exports = {
    analyzeAts
};
