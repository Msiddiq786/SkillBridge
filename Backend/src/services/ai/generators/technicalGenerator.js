const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { technicalQuestionSchema } = require("../schemas");
const { buildTechnicalQuestionsPrompt } = require("../prompts/technical.prompt");

async function generateTechnicalQuestions({ summary, jobDescription, selectedTrack, planConfig }) {
    if (planConfig?.includeTechnical === false || planConfig?.technicalCount === 0) {
        return { technicalQuestions: [] };
    }

    const prompt = buildTechnicalQuestionsPrompt({ summary, jobDescription, selectedTrack, planConfig });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(technicalQuestionSchema)
        }
    });

    const cleanText = (str, prefixPattern) => {
        if (!str || typeof str !== 'string') return '';
        let cleaned = str.trim();
        if (prefixPattern) {
            cleaned = cleaned.replace(prefixPattern, '').trim();
        }
        return cleaned;
    };

    const sanitizedQuestions = Array.isArray(response) ? response.map(q => {
        const oneLineAnswer = cleanText(q.oneLineAnswer, /^([⭐\s]*\d*[-\d\s]*sentences?[\w\s]*:\s*)/i);
        const interviewAnswer = cleanText(q.interviewAnswer, /^([🗣️\s]*\d*[-\d\s]*sentences?[\w\s]*:\s*)/i);
        const simpleExplanation = cleanText(q.simpleExplanation, /^([🧠\s]*\d*[-\d\s]*sentences?[\w\s]*:\s*)/i);
        const realWorldExample = cleanText(q.realWorldExample, /^([🌍\s]*\d*[-\d\s]*sentences?[\w\s]*:\s*)/i);

        return {
            ...q,
            oneLineAnswer,
            interviewAnswer,
            simpleExplanation,
            realWorldExample,
            answer: q.answer || interviewAnswer || oneLineAnswer || ""
        };
    }) : [];

    return { technicalQuestions: sanitizedQuestions };
}

module.exports = { generateTechnicalQuestions };