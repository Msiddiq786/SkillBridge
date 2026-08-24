const { REPORT } = require("../../../config/ai.config");

function buildRoadmapPrompt({ summary, jobDescription, selectedTrack }) {
    const trackContext = selectedTrack
        ? `\nSelected Track: ${selectedTrack}\nTailor the entire roadmap to this specific role's requirements.`
        : "";

    return `You are a technical career coach and interview preparation specialist.

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

Create a ${REPORT.ROADMAP_DAYS}-day interview preparation roadmap as a JSON array.

Each element must have:
1. "day" — day number (1–${REPORT.ROADMAP_DAYS})
2. "focus" — main focus area
3. "difficulty" — "Easy", "Medium", or "Hard"
4. "estimatedStudyTime" — e.g. "3 hours"
5. "tasks" — array of ${REPORT.ROADMAP_TASKS_MIN}–${REPORT.ROADMAP_TASKS_MAX} actionable tasks in simple wording
6. "resources" — array of 2–3 resource names
7. "expectedOutcome" — concrete learning milestone

Rules:
- Progressive difficulty from fundamentals to advanced.
- Days 13–14: technical deep-dive review and behavioral preparation.
- Day ${REPORT.ROADMAP_DAYS}: final mock interview, revision, and confidence-building.
- Use simple, actionable task descriptions.
- Each day should have practical, specific tasks — not generic advice.`;
}

module.exports = {
    buildRoadmapPrompt
};
