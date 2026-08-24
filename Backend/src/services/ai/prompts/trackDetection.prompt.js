function buildTrackDetectionPrompt({ jobDescription }) {
    return `You are an expert job description analyst.

Analyze the following job description and determine if it contains MULTIPLE distinct roles, tracks, or positions.

Many job descriptions list several separate roles (e.g. "Mobile Developer Intern", "AI/ML Intern", "QA Automation Intern") within a single posting.

═══════════════════════════════════════
JOB DESCRIPTION
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Return a JSON object with:

1. "multipleTracksDetected" — boolean, true if the JD contains more than one distinct role/track
2. "tracks" — an array of objects, each containing:
   - "trackTitle" — the specific role title (e.g. "Mobile App Developer Intern")
   - "trackDescription" — the subset of the JD relevant to this specific role (responsibilities, requirements, skills). Extract the actual text from the JD.

Rules:
- If the JD contains only ONE role, return multipleTracksDetected: false and a single track in the array.
- Do NOT invent roles that are not in the JD.
- Extract the track description as faithfully as possible from the original text.
- Normalize role titles (capitalize properly).
- If two roles share common requirements, include the shared requirements in BOTH track descriptions.`;
}

module.exports = {
    buildTrackDetectionPrompt
};
