const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { technicalAnswerEvaluationSchema, behavioralAnswerEvaluationSchema } = require("../schemas");
const { buildTechnicalEvaluationPrompt, buildBehavioralEvaluationPrompt } = require("../prompts/evaluation.prompt");

/**
 * Evaluate technical candidate answer using FAST model
 */
async function evaluateTechnicalAnswer({ question, expectedAnswer, simpleExplanation, easyExample, realWorldExample, userAnswer }) {
    const prompt = buildTechnicalEvaluationPrompt({
        question,
        expectedAnswer,
        simpleExplanation,
        easyExample,
        realWorldExample,
        userAnswer
    });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(technicalAnswerEvaluationSchema)
        }
    });

    return response;
}

/**
 * Evaluate behavioral candidate answer using FAST model
 */
async function evaluateBehavioralAnswer({ question, intention, howToAnswer, situation, task, action, result, userAnswer }) {
    const prompt = buildBehavioralEvaluationPrompt({
        question,
        intention,
        howToAnswer,
        situation,
        task,
        action,
        result,
        userAnswer
    });

    const response = await generateJson({
        model: MODELS.FAST,
        contents: prompt,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(behavioralAnswerEvaluationSchema)
        }
    });

    return response;
}

module.exports = {
    evaluateTechnicalAnswer,
    evaluateBehavioralAnswer
};
