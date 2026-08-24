const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { roadmapSchema } = require("../schemas");
const { buildRoadmapPrompt } = require("../prompts/roadmap.prompt");

async function generateRoadmap({ summary, jobDescription, selectedTrack }) {
    const prompt = buildRoadmapPrompt({ summary, jobDescription, selectedTrack });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(roadmapSchema)
        }
    });

    return { preparationPlan: response };
}

module.exports = { generateRoadmap };