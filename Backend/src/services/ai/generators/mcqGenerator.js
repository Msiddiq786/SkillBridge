const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { mcqQuestionSchema } = require("../schemas");
const { buildMcqPrompt } = require("../prompts/mcq.prompt");

/**
 * Stage 2 — Generate MCQ Practice Questions using FAST model
 */
async function generateMcqQuestions({ summary, jobDescription, selectedTrack }) {
    const prompt = buildMcqPrompt({ summary, jobDescription, selectedTrack });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(mcqQuestionSchema)
        }
    });

    return {
        mcqQuestions: response
    };
}

module.exports = {
    generateMcqQuestions
};
