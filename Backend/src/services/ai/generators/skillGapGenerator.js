const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { skillGapSchema } = require("../schemas");
const { buildSkillGapPrompt } = require("../prompts/skillgap.prompt");

async function generateSkillGap({ resume, summary, jobDescription, selectedTrack, skillClassification }) {
    const prompt = buildSkillGapPrompt({ resume, summary, jobDescription, selectedTrack, skillClassification });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(skillGapSchema)
        }
    });

    // Canonical sanity filter: Never include PRESENT skills in skillGaps
    const presentRequirements = new Set(
        Array.isArray(skillClassification)
            ? skillClassification
                .filter(i => i.status === 'PRESENT')
                .map(i => (i.requirement || i.skill || '').toLowerCase().trim())
            : []
    );

    const safeGaps = Array.isArray(response)
        ? response.filter(gap => {
            const gapName = (gap.skill || '').toLowerCase().trim();
            // Don't include if explicitly marked PRESENT in classification
            return !presentRequirements.has(gapName);
        })
        : [];

    return { skillGaps: safeGaps };
}

module.exports = { generateSkillGap };