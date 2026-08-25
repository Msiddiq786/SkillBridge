/**
 * Build the prompt for Resume PDF generation based on the LaTeX-Style Formula.
 * Called by resumePdfGenerator.js with { resume, selfDescription, jobDescription }.
 *
 * NON-NEGOTIABLE ARCHITECTURE:
 * - The original resume is the SINGLE SOURCE OF TRUTH.
 * - The JD determines: relevance, prioritization, bullet emphasis, category ordering, and summary targeting.
 * - Target approximately: 60–80% factual content preservation + 20–40% JD-driven reorganization/rewording.
 * - Guaranteed single-page density:
 *   * Summary: 2–3 concise lines targeted to the role using verified skills.
 *   * Experience: Maximum 2 bullets per role emphasizing relevant engineering tasks.
 *   * Projects: Ordered by JD relevance, maximum 2 bullets per project.
 *   * Skills: Grouped and ordered by JD relevance (e.g. AI/ML first for AI roles).
 *   * Education: Compact two-column layout.
 */
function buildResumePdfPrompt({ resume, selfDescription, jobDescription }) {

    return `You are an expert ATS resume writer and LaTeX-style document designer.

Generate a tailored, modern, highly polished, ATS-optimized, EXACTLY ONE-PAGE resume in valid HTML matching the single-page LaTeX resume layout.

═══════════════════════════════════════
ORIGINAL RESUME (SINGLE SOURCE OF TRUTH)
═══════════════════════════════════════
${resume}

═══════════════════════════════════════
CANDIDATE SELF-DESCRIPTION (SUPPLEMENTARY CONTEXT)
═══════════════════════════════════════
${selfDescription || "Not provided."}

═══════════════════════════════════════
TARGET JOB DESCRIPTION (FOR RELEVANCE & PRIORITIZATION)
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
CORE TAILORING DIRECTIVES (MORE RELEVANCE + SAME FACTUAL TRUTH)
═══════════════════════════════════════

The tailored resume must be meaningfully targeted to the Job Description (approx 60–80% factual content preservation + 20–40% JD-driven reorganization and rewording). Do NOT merely copy the source resume verbatim.

1. TAILORED PROFESSIONAL SUMMARY:
   - Write a compelling 2–3 line summary (40–55 words) directly targeted to the target role.
   - Example pattern: "[Degree/Field] student with hands-on experience developing [relevant domain, e.g. AI-powered / full-stack] applications using [verified technologies from resume, e.g. Python, Google Gemini API, YOLOv8, OpenCV, Flask, REST APIs]. Seeking [Target Role Title] to contribute to [key JD objective using verified capabilities]."
   - Use only facts from the original resume.

2. REORDER & PRIORITIZE SKILLS:
   - Do NOT keep the source resume skill order mechanically.
   - Place the most JD-relevant skill category FIRST. For example, for an AI/ML role:
     * AI & Machine Learning: Google Gemini API, NLP, YOLOv8, OpenCV
     * Programming Languages: Python, C++, JavaScript, SQL
     * Backend & Web Development: Flask, REST APIs, Node.js, Express.js, React.js
     * Databases & Storage: MongoDB, SQLite, Redis
     * Developer Tools: Git, GitHub, Postman, VS Code
   - Within each category, put the most JD-relevant verified skills first (e.g. Python before C++, Google Gemini API before NLP).

3. PRIORITIZE PROJECTS BY JD RELEVANCE:
   - Reorder projects so that the project most aligned with the target job appears FIRST.
   - For an AI/ML position, place the GenAI/Gemini platform (e.g. SkillBridge) first, followed by Computer Vision / Python automation (e.g. AI Security & Attendance System).

4. REWORD & STRENGTHEN BULLETS FOR JD IMPACT:
   - Do NOT copy raw bullets verbatim from the source.
   - Reword bullets to highlight relevant engineering actions, verified technologies, and clear technical outcomes while preserving 100% factual accuracy.
   - For Experience: Emphasize Python automation, OOP, DSA, optimization, and debugging for technical roles; emphasize APIs, backend integration, and Git for web roles.
   - For Projects:
     * Bullet 1: What was built, its primary architecture, and domain impact.
     * Bullet 2: Specific verified technical implementations (e.g. Gemini API integration, prompt/pipeline flow, YOLOv8 computer vision models, SQLite management).
   - Keep maximum 2 crisp, impactful bullets per project and experience entry.

5. NON-NEGOTIABLE GROUNDING RULES (ZERO INVENTIONS):
   - Do NOT add technologies NOT present in the source resume (e.g. No "RAG", No "Vector Databases", No "Docker", No "Kubernetes", No "FastAPI", No "Model Monitoring", No "AML/KYC", No "Feature Extraction").
   - If the JD asks for a skill the candidate lacks (e.g. RAG), DO NOT invent it.
   - Preserve project names (e.g. "AI Security & Attendance System" must not be renamed to "Document Processing System").
   - Zero fabricated metrics or percentages (no invented "improved speed by 35%").

═══════════════════════════════════════
SECTION STRUCTURE & CONTENT LIMITS (EXACTLY ONE PAGE)
═══════════════════════════════════════

Generate sections in this EXACT order (include only sections with source evidence):

1. HEADER:
   - Candidate Name (Prominent uppercase, bold, centered, color: #0b4f6c).
   - Contact line (Centered, 8.8pt, color: #374151):
     Phone | Email | LinkedIn | GitHub | Location (only verified details).

2. PROFESSIONAL SUMMARY:
   - EXACTLY 2–3 concise lines (approx 40–55 words) tailored to target JD.

3. TECHNICAL SKILLS:
   - Grouped single-line categories ordered by JD relevance. Exclude unsupported keywords.

4. PROJECTS:
   - Ordered by JD relevance.
   - For each project:
     * Header row (flex space-between): <strong>Project Name</strong> | Tech Stack or Year
     * EXACTLY 2 concise, strengthened bullets highlighting verified technologies.

5. EXPERIENCE:
   - For each role:
     * Header row (flex space-between): <strong>Job Title</strong> — Company Name | Dates
     * EXACTLY 2 concise factual bullets emphasizing relevant technical responsibilities.

6. EDUCATION:
   - Two-column alignment:
     * Left: <strong>Degree Name</strong> | Institution Name
     * Right: Duration/Year | CGPA or Grade

7. CERTIFICATIONS / AWARDS (if in source):
   - Concise one-line entries: Certification Name — Issuer (Year).

═══════════════════════════════════════
HTML & CSS DESIGN SPECIFICATION (LATEX LOOK)
═══════════════════════════════════════

Return a JSON object with:
{
  "html": "<!DOCTYPE html><html lang=\"en\">...</html>"
}

HTML Guidelines for EXACT Single-Page A4:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 0.55in;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: Arial, Helvetica, 'Segoe UI', Roboto, sans-serif;
    font-size: 9.3pt;
    line-height: 1.26;
    color: #111827;
    background: #fff;
    padding: 0;
  }
  .resume-container {
    width: 100%;
  }
  .header {
    text-align: center;
    margin-bottom: 5px;
  }
  .name {
    font-size: 16.5pt;
    font-weight: 700;
    color: #0b4f6c;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .contact-bar {
    font-size: 8.6pt;
    color: #374151;
  }
  .section-title {
    font-size: 9.8pt;
    font-weight: 700;
    color: #0b4f6c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1.2px solid #0b4f6c;
    margin-top: 5px;
    margin-bottom: 3px;
    padding-bottom: 1px;
  }
  .summary-text {
    font-size: 9.0pt;
    color: #1f2937;
    line-height: 1.28;
    text-align: justify;
    margin-bottom: 2px;
  }
  .two-col-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 9.2pt;
    margin-bottom: 1px;
  }
  .two-col-row .left-primary {
    font-weight: 700;
    color: #111827;
  }
  .two-col-row .right-primary {
    font-weight: 600;
    color: #374151;
    font-size: 8.6pt;
  }
  .two-col-row .left-secondary {
    font-style: italic;
    color: #4b5563;
    font-size: 8.6pt;
  }
  .two-col-row .right-secondary {
    color: #4b5563;
    font-size: 8.6pt;
  }
  .skills-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 9.0pt;
  }
  .skill-row {
    line-height: 1.26;
  }
  .skill-label {
    font-weight: 700;
    color: #111827;
  }
  .item-block {
    margin-bottom: 3.5px;
  }
  ul.compact-list {
    padding-left: 14px;
    margin: 1px 0 0 0;
  }
  ul.compact-list li {
    font-size: 9.0pt;
    line-height: 1.26;
    color: #1f2937;
    margin-bottom: 1px;
  }
</style>
</head>
<body>
  <div class="resume-container">
    <!-- Content goes here -->
  </div>
</body>
</html>
\`\`\`

═══════════════════════════════════════
MANDATORY PRE-OUTPUT CHECKLIST
═══════════════════════════════════════
[ ] Summary is tailored to the target role with verified skills (2–3 lines).
[ ] Skills are categorized and ordered by JD relevance.
[ ] Most relevant project is prioritized first.
[ ] Bullets are reworded to highlight verified engineering actions without copying verbatim.
[ ] Unsupported keywords (RAG, Docker, Vector DBs, FastAPI, etc.) are 100% ABSENT.
[ ] Project name is "AI Security & Attendance System" without additions.
[ ] Fits on exactly 1 page.`;

}

module.exports = {
    buildResumePdfPrompt
};
