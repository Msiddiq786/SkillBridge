const { REPORT } = require("../../../config/ai.config");

function buildRoadmapPrompt({ resume, summary, jobDescription, selectedTrack, skillClassification, planConfig }) {
    const trackContext = selectedTrack
        ? `\nSelected Track: ${selectedTrack}\nTailor the entire roadmap to this specific role's requirements.`
        : "";

    const days = typeof planConfig?.roadmapDays === 'number' ? planConfig.roadmapDays : REPORT.ROADMAP_DAYS;
    const intensity = (planConfig?.roadmapIntensity || "balanced").toLowerCase();
    const hoursPerDay = intensity === 'light' ? '1–2 hours' : intensity === 'intensive' ? '4–6 hours' : '2–4 hours';

    const focusTopics = Array.isArray(planConfig?.focusAreas) && planConfig.focusAreas.length > 0
        ? `\nPRIORITY FOCUS AREAS:\nDedicate early, focused roadmap days to: ${planConfig.focusAreas.join(", ")}.\n`
        : "";

    const nonPresentGaps = Array.isArray(skillClassification)
        ? skillClassification
            .filter(item => item.status !== 'PRESENT')
            .map(item => `- ${item.requirement || item.skill} (${item.status})`)
            .join('\n')
        : "";

    const strongSkills = Array.isArray(skillClassification)
        ? skillClassification
            .filter(item => item.status === 'PRESENT')
            .map(item => item.requirement || item.skill)
            .join(', ')
        : "";

    return `You are an expert technical career coach and interview preparation specialist.

═══════════════════════════════════════
CANONICAL SKILL ANALYSIS (SOURCE OF TRUTH):
═══════════════════════════════════════
- CANDIDATE'S STRONG / PRESENT SKILLS: ${strongSkills || 'Python, REST APIs, Git'}
- CANDIDATE'S HIGH-PRIORITY GAPS (LEARNING PRIORITIES):
${nonPresentGaps || '- Core role gaps from JD'}

═══════════════════════════════════════
CRITICAL ROADMAP DESIGN RULES:
═══════════════════════════════════════
1. GAP-DRIVEN PRIORITY:
   - Do NOT spend multiple full days reviewing skills the candidate already demonstrates (e.g. basic Python syntax, basic REST endpoints).
   - Prioritize the candidate's actual skill gaps (e.g. RAG architecture, Vector Databases, ML model evaluation, deployment, feature engineering) early in the ${days} days so they have time to build working projects.
2. RESUME SAFETY RULE:
   - NEVER tell the user to blindly put unlearned technologies on their resume.
   - If mentioning resume updates, ALWAYS say: "Learn [Technology], build a working demo project, and once you have genuine hands-on experience, update your resume to reflect it."
3. STUDY INTENSITY:
   - Plan daily tasks calibrated for ${hoursPerDay} of study per day (${intensity} intensity).
4. PROGRESSIVE STRUCTURE FOR EXACTLY ${days} DAYS:
   - Early phase (Days 1–${Math.max(2, Math.floor(days * 0.25))}): High-priority technical foundations & initial gap demo implementations.
   - Core implementation (Days ${Math.max(3, Math.floor(days * 0.25) + 1)}–${Math.floor(days * 0.7)}): Practical end-to-end integration, API endpoints, evaluation & error handling.
   - Advanced & Polish (Days ${Math.floor(days * 0.7) + 1}–${days - 1}): System design, deployment/monitoring, edge cases, revision, and STAR behavioral practice.
   - Day ${days}: Comprehensive mock interview simulation, readiness review, and final confidence building.

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

Create a comprehensive exactly ${days}-day interview preparation roadmap as a JSON array (containing exactly ${days} daily entries from day 1 to day ${days}).

Each element must have:
1. "day" — integer 1 to ${days}
2. "focus" — clear, professional title for the day's focus (e.g. "RAG Architecture & Vector Indexing")
3. "difficulty" — exactly "Easy", "Medium", or "Hard"
4. "estimatedStudyTime" — e.g. "${hoursPerDay}"
5. "whyThisMatters" — 1–2 simple sentences explaining why this day is essential for the candidate's specific gaps / interview readiness.
6. "gapAddressed" — the specific gap or competency addressed (e.g. "RAG / Vector Databases", "Model Evaluation").
7. "tasks" — array of ${REPORT.ROADMAP_TASKS_MIN}–${REPORT.ROADMAP_TASKS_MAX} practical, actionable learning & coding steps.
8. "resources" — array of 2–3 concise, high-quality resource names.
9. "expectedOutcome" — 1 concrete, verifiable milestone (e.g. "You can build and query a local vector index with chunking and retrieval.").`;
}

module.exports = {
    buildRoadmapPrompt
};
