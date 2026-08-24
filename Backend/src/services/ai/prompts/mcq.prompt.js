const { REPORT } = require("../../../config/ai.config");

function buildMcqPrompt({ summary, jobDescription, selectedTrack }) {
    const trackContext = selectedTrack
        ? `\nSelected Track: ${selectedTrack}\nFocus questions specifically on this role's requirements.`
        : "";

    return `You are an expert technical interviewer creating multiple-choice practice questions.

═══════════════════════════════════════
CANDIDATE SUMMARY (from resume analysis)
═══════════════════════════════════════
${summary}

═══════════════════════════════════════
TARGET JOB DESCRIPTION
═══════════════════════════════════════
${jobDescription}${trackContext}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Generate exactly ${REPORT.MCQ_QUESTION_COUNT} multiple-choice questions as a JSON array.

Difficulty distribution:
- 6 Easy
- 6 Medium
- 3 Hard

Each element must be a JSON object with these fields:

1. "question" — clear, concise question text
2. "difficulty" — exactly one of "Easy", "Medium", "Hard"
3. "category" — technical area (e.g. "Python", "Data Structures", "System Design")
4. "options" — array of exactly 4 answer choices (strings)
5. "correctAnswer" — the exact text of the correct option (must match one of the 4 options exactly)
6. "explanation" — brief explanation of why the correct answer is right (2-3 sentences max)
7. "resource" — one learning resource name

Rules:
- Questions must be relevant to the candidate's target role and background.
- Use simple, clear English.
- Each question must have exactly 4 options and exactly 1 correct answer.
- Do NOT make all correct answers the same position (vary A/B/C/D).
- Do NOT use "All of the above" or "None of the above".
- Explanations should be concise — NOT 150-200 words.`;
}

module.exports = {
    buildMcqPrompt
};
