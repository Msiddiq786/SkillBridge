function buildSkillGapPrompt({ resume, summary, jobDescription, selectedTrack }) {
    const trackContext = selectedTrack
        ? `\nSelected Track: ${selectedTrack}\nAnalyze gaps ONLY for this specific role.`
        : "";

    return `You are a career development expert and technical skills assessor.

CRITICAL: The ORIGINAL resume text below is the source of truth for skills assessment.
- Do NOT call a technology a skill gap when it is clearly present in the resume.
- Normalize equivalent forms: React Native = ReactNative, REST API = REST APIs, etc.
- Distinguish between skills, experience, and responsibilities.

═══════════════════════════════════════
ORIGINAL RESUME (SOURCE OF TRUTH)
═══════════════════════════════════════
${resume}

═══════════════════════════════════════
CANDIDATE SUMMARY
═══════════════════════════════════════
${summary}

═══════════════════════════════════════
TARGET JOB DESCRIPTION
═══════════════════════════════════════
${jobDescription}${trackContext}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Identify genuine skill gaps between the candidate and the job requirements.
Return a JSON array of skill gap objects.

Each element must have:
1. "skill" — the specific skill or technology
2. "severity" — "low", "medium", or "high"
3. "priority" — "Critical", "High", "Medium", or "Low"
4. "reason" — why this matters for the role (2–3 sentences)
5. "improvement" — actionable advice (2–3 sentences)
6. "estimatedLearningTime" — e.g. "2 weeks", "1 month"
7. "resources" — array of 2–3 learning resources

Rules:
- Only identify GENUINE gaps based on the original resume.
- Do NOT list skills that ARE present in the resume as gaps.
- Order from most critical to least critical.
- Include 3–10 skill gaps.`;
}

module.exports = {
    buildSkillGapPrompt
};
