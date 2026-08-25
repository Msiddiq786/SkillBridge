const { REPORT } = require("../../../config/ai.config");

function buildTechnicalQuestionsPrompt({ summary, jobDescription, selectedTrack, planConfig }) {
    const trackContext = selectedTrack
        ? `\nSelected Track: ${selectedTrack}\nFocus ALL questions strictly on this specific role's technology stack and core domain.`
        : "";

    const count = typeof planConfig?.technicalCount === 'number' ? planConfig.technicalCount : REPORT.TECHNICAL_QUESTION_COUNT;
    const easy = typeof planConfig?.technicalDifficulty?.easy === 'number' ? planConfig.technicalDifficulty.easy : Math.round(count * 0.35);
    const medium = typeof planConfig?.technicalDifficulty?.medium === 'number' ? planConfig.technicalDifficulty.medium : Math.round(count * 0.4);
    const hard = typeof planConfig?.technicalDifficulty?.hard === 'number' ? planConfig.technicalDifficulty.hard : Math.max(0, count - easy - medium);
    const followUps = typeof planConfig?.technicalFollowUpsPerQuestion === 'number' ? planConfig.technicalFollowUpsPerQuestion : REPORT.TECHNICAL_FOLLOWUP_COUNT;
    const focusTopics = Array.isArray(planConfig?.focusAreas) && planConfig.focusAreas.length > 0
        ? `\nPRIORITY CANDIDATE FOCUS TOPICS:\nPrioritize generating questions covering: ${planConfig.focusAreas.join(", ")} (while remaining strictly grounded in the target JD).\n`
        : "";

    return `You are an expert AI Technical Interview Coach designed for beginners and students preparing for their first interviews.

LANGUAGE & TEACHING RULES:
- Use VERY SIMPLE, PLAIN ENGLISH.
- Write as if explaining step-by-step to a student preparing for their very first interview.
- Avoid academic language, overly complex terminology, giant walls of text, and unexplained jargon.
- Use simple analogies and intuitive explanations.
- Follow the exact 10-step learning formula for each question:
  Question → One-Line Answer → Simple Explanation → Easy Example → Real-World Example → How to Say It in Interview → Common Mistakes → Progressive Follow-Ups → Quick Memory Tip → Resources.

═══════════════════════════════════════
CANDIDATE SUMMARY
═══════════════════════════════════════
${summary}

═══════════════════════════════════════
TARGET JOB DESCRIPTION
═══════════════════════════════════════
${jobDescription}${trackContext}${focusTopics}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Generate exactly ${count} technical interview questions as a JSON array.

Difficulty distribution:
- ${easy} Easy (simple core concepts)
- ${medium} Medium (concept + practical application)
- ${hard} Hard (concept + trade-off + deeper reasoning)
(Note: Difficulty affects the technical depth of the concept, NOT language complexity. ALL explanations must remain in very simple English!)

Each element in the array must be a JSON object with these EXACT fields:

1. "question" — clear, beginner-friendly question as an interviewer would ask it (e.g. "What is the difference between a list and a tuple in Python?").
2. "difficulty" — exactly "Easy", "Medium", or "Hard".
3. "category" — technology area (e.g. "Python Basics", "React Hooks", "REST APIs", "SQL Queries").
4. "estimatedInterviewTime" — e.g. "3–5 minutes".
5. "oneLineAnswer" — ⭐ ONE clear, simple sentence giving the direct answer first (e.g. "Lists can be changed after creation, while tuples cannot.").
6. "simpleExplanation" — 💡 Beginner-friendly explanation in 3–5 short sentences using simple analogies (e.g. "A list is like a notebook where you can add, remove, or change items. A tuple is like a printed sheet where values stay fixed.").
7. "easyExample" — 🧪 Shortest possible code snippet or minimal demonstration (e.g. "my_list = [1, 2]\nmy_list[0] = 10\n\nmy_tuple = (1, 2)\n# my_tuple[0] = 10 -> Error") followed by a 1-sentence explanation.
8. "realWorldExample" — 🌍 1 practical real-world scenario showing where to use this (e.g. "Use a list for a shopping cart because items can be added or removed. Use a tuple for fixed coordinates like latitude and longitude.").
9. "howToSayIt" — 🎤 Natural, conversational spoken answer the student can actually say in an interview (2–3 spoken sentences, never sounding like a memorized textbook).
10. "commonMistakes" — ⚠ Array of 2–4 concise student mistakes to avoid.
11. "followUpQuestions" — ➡ Array of EXACTLY ${followUps} progressive follow-up questions ordered strictly from Easy → Medium → Deeper (building logically on the main topic).
12. "quickMemoryTip" — 🧠 1 very short memory trick (e.g. "List = changeable. Tuple = fixed.").
13. "resources" — 📚 Array of 1–3 useful learning resources (e.g. ["Python Official Documentation", "Real Python"]).

Do NOT repeat the same explanations across Answer, Simple Explanation, Real-World Example, and How To Say It. Each section must serve its distinct purpose.`;
}

module.exports = {
    buildTechnicalQuestionsPrompt
};
