function buildSkillGapPrompt({ resume, summary, jobDescription, selectedTrack, skillClassification }) {
    const trackContext = selectedTrack
        ? `\nSelected Track: ${selectedTrack}\nAnalyze gaps ONLY for this specific role.`
        : "";

    const nonPresentRequirements = Array.isArray(skillClassification)
        ? skillClassification
            .filter(item => item.status !== 'PRESENT')
            .map(item => `- ${item.requirement || item.skill} (Status: ${item.status}, Evidence: ${item.evidence || 'None'})`)
            .join('\n')
        : "";

    const classificationContext = nonPresentRequirements
        ? `\n═══════════════════════════════════════\nCANONICAL NON-PRESENT SKILL GAPS (SOURCE OF TRUTH)\n═══════════════════════════════════════\n${nonPresentRequirements}\n`
        : "";

    return `You are a career development expert and technical skills assessor.

CRITICAL RULES:
1. The ORIGINAL resume text and canonical non-present requirements below are the source of truth.
2. Only generate skill gaps for requirements that are truly NOT PRESENT (status: PARTIALLY_DEMONSTRATED, NOT_DEMONSTRATED, or MISSING).
3. Do NOT include skills that are PRESENT in the candidate's resume (e.g. Python, REST APIs, Git, Flask if demonstrated).
4. For each genuine gap, provide actionable, realistic learning paths.
${classificationContext}
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

Return a JSON array of skill gap objects for genuine candidate gaps:

Each element must have:
1. "skill" — the specific skill/requirement name (matching the canonical requirement)
2. "severity" — exactly "low", "medium", or "high"
3. "priority" — exactly "Critical", "High", "Medium", or "Low"
4. "reason" — why this matters for the role (2–3 sentences)
5. "improvement" — actionable learning advice (2–3 sentences)
6. "estimatedLearningTime" — e.g. "2 weeks", "1 month"
7. "resources" — array of 2–3 learning resources

Order from most critical to least critical.`;
}

module.exports = {
    buildSkillGapPrompt
};
