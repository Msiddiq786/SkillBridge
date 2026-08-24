/**
 * Build the prompt for Resume PDF generation.
 * Called by resumePdfGenerator.js with { resume, selfDescription, jobDescription }.
 */
function buildResumePdfPrompt({ resume, selfDescription, jobDescription }) {

    return `You are an expert resume writer specializing in ATS-optimized resumes.

═══════════════════════════════════════
ORIGINAL RESUME
═══════════════════════════════════════
${resume}

═══════════════════════════════════════
CANDIDATE SELF-DESCRIPTION
═══════════════════════════════════════
${selfDescription}

═══════════════════════════════════════
TARGET JOB DESCRIPTION
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

Generate an improved, ATS-friendly resume as clean HTML.

Return a JSON object with a single field:
- "html" — complete HTML string for the resume

HTML Requirements:
- Use clean, semantic HTML (no external CSS frameworks).
- Include inline CSS styles for professional formatting.
- Use a readable font stack: Arial, Helvetica, sans-serif.
- Sections: Contact Info, Professional Summary, Skills, Experience, Education, Certifications (if applicable).
- Keep it to 1–2 pages when printed on A4.
- Use appropriate heading hierarchy (h1, h2, h3).
- Use bullet points for experience descriptions.
- Optimize keywords for ATS parsing based on the job description.

Rules:
- Do NOT invent any information not present in the original resume.
- Do NOT add fake companies, roles, dates, or certifications.
- You MAY rephrase and restructure existing content for clarity and ATS optimization.
- You MAY add relevant keywords from the job description if the candidate has related experience.`;

}

module.exports = {
    buildResumePdfPrompt
};
