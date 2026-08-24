const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { trackDetectionSchema } = require("../schemas");
const { buildTrackDetectionPrompt } = require("../prompts/trackDetection.prompt");

/**
 * Detect multiple roles/tracks in a job description
 */
async function detectTracks({ jobDescription }) {
    const prompt = buildTrackDetectionPrompt({ jobDescription });

    return await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(trackDetectionSchema)
        }
    });
}

module.exports = {
    detectTracks
};
