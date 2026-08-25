const { REPORT } = require("../../../config/ai.config");

function buildBehavioralQuestionsPrompt({ resume, summary, selfDescription, planConfig }) {
    const resumeContext = resume ? `\n═══════════════════════════════════════\nCANDIDATE RESUME & PROJECTS (SOURCE OF TRUTH)\n═══════════════════════════════════════\n${resume}\n` : "";
    const selfDescContext = selfDescription ? `\n═══════════════════════════════════════\nCANDIDATE SELF-DESCRIPTION\n═══════════════════════════════════════\n${selfDescription}\n` : "";

    const count = typeof planConfig?.behavioralCount === 'number' ? planConfig.behavioralCount : REPORT.BEHAVIORAL_QUESTION_COUNT;
    const easy = typeof planConfig?.behavioralDifficulty?.easy === 'number' ? planConfig.behavioralDifficulty.easy : Math.round(count * 0.4);
    const medium = typeof planConfig?.behavioralDifficulty?.medium === 'number' ? planConfig.behavioralDifficulty.medium : Math.round(count * 0.4);
    const hard = typeof planConfig?.behavioralDifficulty?.hard === 'number' ? planConfig.behavioralDifficulty.hard : Math.max(0, count - easy - medium);
    const focusTopics = Array.isArray(planConfig?.focusAreas) && planConfig.focusAreas.length > 0
        ? `\nPRIORITY FOCUS SCENARIOS:\nEmphasize questions touching behavioral scenarios in: ${planConfig.focusAreas.join(", ")}.\n`
        : "";

    return `You are an expert AI Behavioral Interview Coach helping beginners and students master the STAR method.

LANGUAGE & COACHING RULES:
- Use VERY SIMPLE, CONVERSATIONAL ENGLISH.
- Write as if coaching a student for their very first interview.
- Explain the question, how to think about it, and break down STAR in simple terms.
- Strictly ground answers in the candidate's REAL projects and resume.

CRITICAL ANTI-HALLUCINATION RULES:
1. The candidate resume and projects below are the ONLY source of truth.
2. NEVER invent fake companies, fake internships, fake metrics, awards, leadership titles, or team sizes.
3. If the candidate built a project (e.g. SkillBridge), reference that project truthfully as a project, NEVER as an internship.
4. If no direct resume evidence exists for a question, provide a structured template clearly marked "[Customize with your real project or experience: describe a time when you...]".

${resumeContext}${selfDescContext}${focusTopics}
═══════════════════════════════════════
CANDIDATE SUMMARY
═══════════════════════════════════════
${summary}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Generate exactly ${count} behavioral interview questions as a JSON array.

Difficulty distribution:
- ${easy} Easy (teamwork, self-learning, adaptability, communication)
- ${medium} Medium (handling deadlines, technical disagreements, feedback, debugging under pressure)
- ${hard} Hard (navigating ambiguity, architectural trade-offs, major project pivots)

Each element must be a JSON object with these EXACT fields:

1. "question" — natural behavioral question (e.g. "Tell me about a time you had to learn a new tool or technology quickly.").
2. "difficulty" — exactly "Easy", "Medium", or "Hard".
3. "whatTheyAreAsking" — 🎯 2–3 simple sentences explaining what the interviewer is really checking (e.g. "They want to know how quickly you can learn something new and solve problems when you do not already know the technology.").
4. "howToThink" — 🧠 1–2 simple coaching sentences (e.g. "Think of a college project, hackathon, or personal project where you had to pick up a new library or tool.").
5. "starBreakdown" — ⭐ Object with 4 simple strings:
   - "situation" — S (Situation): What was happening? (1 simple sentence grounded in candidate's real project).
   - "task" — T (Task): What did you need to do? (1 simple sentence).
   - "action" — A (Action): What exactly did YOU do? (1–2 simple sentences).
   - "result" — R (Result): What happened in the end and what did you learn? (1 sentence).
6. "simpleExample" — 💬 Grounded real example from candidate's verified resume/project (or clean template if unrepresented).
7. "realWorldExample" — 🌍 What a natural full answer sounds like (3–5 conversational sentences).
8. "howToSayIt" — 🎤 Shorter natural spoken version the candidate can say out loud (2–3 sentences).
9. "commonMistakes" — ⚠ Array of 2–4 common student mistakes (e.g. ["Giving a fake story", "Talking only about the tech and not what YOU did", "Forgetting to share the final result"]).
10. "followUpQuestions" — ➡ Array of 3–5 realistic interviewer follow-up questions (e.g. ["What was the hardest part of learning it?", "What would you do differently next time?"]).
11. "quickTemplate" — 📝 Fill-in template for the student:
    "Situation: I was working on [project]...\nTask: I needed to [goal]...\nAction: I [action taken]...\nResult: As a result, [outcome]."`;
}

module.exports = {
    buildBehavioralQuestionsPrompt
};
