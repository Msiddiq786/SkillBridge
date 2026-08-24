function buildAtsAnalysisPrompt({ resume, jobDescription, resumeAnalysis }) {
    return `You are an expert ATS (Applicant Tracking System) analyzer.

CRITICAL: Analyze the ORIGINAL resume only. Do NOT analyze any AI-generated resume.

═══════════════════════════════════════
ORIGINAL RESUME
═══════════════════════════════════════
${resume}

═══════════════════════════════════════
JOB DESCRIPTION
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
PREVIOUS ANALYSIS (for context)
═══════════════════════════════════════
${JSON.stringify(resumeAnalysis, null, 2)}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Return a JSON object with:
1. "atsScore" (0-100): objective ATS compatibility score
2. "keywordMatch": array of JD keywords present in resume
3. "missingKeywords": array of JD keywords missing from resume
4. "strongKeywords": array of keywords where candidate shows strong experience
5. "weakKeywords": array of keywords with weak/limited experience
6. "resumeStrengths": array of resume strength statements
7. "resumeWeaknesses": array of resume weakness statements
8. "improvementSuggestions": array of actionable improvement suggestions

Rules:
- Do NOT inflate score based on AI-generated content.
- Classify keywords by evidence level in the ORIGINAL resume.
- Be actionable and specific in suggestions.`;
}

module.exports = {
    buildAtsAnalysisPrompt
};
