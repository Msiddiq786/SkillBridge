const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { skillGapSchema } = require("../schemas");
const { buildSkillGapPrompt } = require("../prompts/skillgap.prompt");

async function generateSkillGap({ resume, summary, jobDescription, selectedTrack }) {
    const prompt = buildSkillGapPrompt({ resume, summary, jobDescription, selectedTrack });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(skillGapSchema)
        }
    });

    return { skillGaps: response };
}

module.exports = { generateSkillGap };