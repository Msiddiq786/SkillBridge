const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { behavioralQuestionSchema } = require("../schemas");
const { buildBehavioralQuestionsPrompt } = require("../prompts/behavior.prompt");

/**
 * Stage 2
 * Generate Behavioral Interview Questions using FAST model
 */
async function generateBehavioralQuestions({
    resume,
    summary,
    selfDescription,
    planConfig
}) {
    if (planConfig?.includeBehavioral === false || planConfig?.behavioralCount === 0) {
        return { behavioralQuestions: [] };
    }

    const prompt = buildBehavioralQuestionsPrompt({
        resume,
        summary,
        selfDescription,
        planConfig
    });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(behavioralQuestionSchema)
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
        const situation = cleanText(q.situation, /^(situation\s*:\s*)/i);
        const task = cleanText(q.task, /^(task\s*:\s*)/i);
        const action = cleanText(q.action, /^(action\s*:\s*)/i);
        const result = cleanText(q.result, /^(result\s*:\s*)/i);
        const intention = cleanText(q.intention, /^([🎯🧩🗣️⭐\s]*\d*[-\d\s]*sentences?[\w\s]*:\s*)/i);
        const howToAnswer = cleanText(q.howToAnswer, /^([🎯🧩🗣️⭐\s]*\d*[-\d\s]*sentences?[\w\s]*:\s*)/i);
        const interviewAnswer = cleanText(q.interviewAnswer, /^([🎯🧩🗣️⭐\s]*\d*[-\d\s]*sentences?[\w\s]*:\s*)/i);

        return {
            ...q,
            situation,
            task,
            action,
            result,
            intention,
            howToAnswer,
            interviewAnswer,
            answer: q.answer || interviewAnswer || `${situation} ${task} ${action} ${result}`.trim()
        };
    }) : [];

    return {
        behavioralQuestions: sanitizedQuestions
    };

}

module.exports = {
    generateBehavioralQuestions
};