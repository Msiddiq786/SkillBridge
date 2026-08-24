function buildResumeAnalysisPrompt({ resume, selfDescription, jobDescription, selectedTrack }) {
    const trackContext = selectedTrack
        ? `\n\nSELECTED TARGET TRACK: ${selectedTrack}\nAnalyze the candidate's resume specifically against this track's requirements.`
        : "";

    return `You are an expert resume analyst and technical recruiter.

Analyze the candidate's original resume against the target job description and self-description.

CRITICAL RULES:
- The ORIGINAL resume text below is the ONLY source of truth.
- Do NOT invent companies, roles, experience, metrics, or certifications not in the resume.
- Normalize equivalent forms: React Native = ReactNative, REST API = REST APIs, TypeScript = Typescript, etc.
- Classify every requirement as SKILL, EXPERIENCE, or RESPONSIBILITY. Do NOT label everything as "skill".
- Keep evidence short, factual, and strictly grounded in the source text.

═══════════════════════════════════════
CANDIDATE RESUME (SOURCE OF TRUTH)
═══════════════════════════════════════
${resume}

═══════════════════════════════════════
CANDIDATE SELF-DESCRIPTION
═══════════════════════════════════════
${selfDescription}

═══════════════════════════════════════
TARGET JOB DESCRIPTION
═══════════════════════════════════════
${jobDescription}${trackContext}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Return a JSON object with:

1. "title" — the job title from the job description (or selected track title).
2. "company" — the company name from the job description.
3. "matchScore" — realistic integer 0–100 based on verified candidate evidence.
4. "summary" — 2–3 short, simple sentences summarizing candidate fit. Avoid academic jargon.
5. "scoreExplanation" — object with:
   - "reasoning" — 1–2 simple sentences explaining why the candidate received this match score.
6. "skillClassification" — array of objects for EVERY key requirement in the job description:
   - "requirement" — clear, full name of the requirement (e.g. "React Native", "REST APIs", "App Store deployment", "CI/CD pipelines").
   - "type" — exactly one of: "SKILL", "EXPERIENCE", "RESPONSIBILITY".
   - "status" — exactly one of:
     * "PRESENT" — clearly demonstrated in the candidate's resume/projects.
     * "PARTIALLY_DEMONSTRATED" — mentioned or foundational familiarity shown, but lacks depth/production proof.
     * "NOT_DEMONSTRATED" — candidate has related skills, but this specific requirement is not demonstrated.
     * "MISSING" — no evidence at all in the resume.
   - "evidence" — 1 concise sentence citing the exact project/experience or stating why it is missing.

Rules:
- Be thorough in skillClassification (include 8–15 distinct requirements covering technical skills, experiences, and responsibilities from the JD).
- Use simple, direct English in all summaries and explanations.`;
}

module.exports = {
    buildResumeAnalysisPrompt
};
