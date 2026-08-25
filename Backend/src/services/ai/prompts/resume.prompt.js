function buildResumeAnalysisPrompt({ resume, selfDescription, jobDescription, selectedTrack }) {
    const trackContext = selectedTrack
        ? `\n\nSELECTED TARGET TRACK: ${selectedTrack}\nAnalyze the candidate's resume specifically against this track's requirements.`
        : "";

    return `You are an expert resume analyst and technical recruiter.

Analyze the candidate's original resume against the target job description and self-description.

═══════════════════════════════════════
CRITICAL RULES & SOURCE OF TRUTH:
═══════════════════════════════════════
1. The ORIGINAL resume text below is the ONLY source of truth for candidate facts.
2. Do NOT invent companies, internships, roles, experiences, metrics, or certifications not in the resume.
3. Normalize equivalent technical terms: React Native = ReactNative, REST API = REST APIs, TypeScript = Typescript, etc.
4. STRICT TYPE SEPARATION:
   - "SKILL": Concrete languages, tools, frameworks, databases, libraries (e.g. Python, SQL, REST APIs, Git, Gemini API, YOLOv8, OpenCV, Flask, Docker).
   - "RESPONSIBILITY": Actions, workflows, processes, tasks (e.g. "Work with REST APIs to integrate AI services", "Write clean Python code and document experiments", "Build and evaluate ML models", "Collaborate with cross-functional teams").
   - "EDUCATION": Degree, field of study, university requirements.
   - "OTHER": Certifications, soft skills, or domain requirements.
   NEVER label a responsibility as a skill.

═══════════════════════════════════════
COMPOUND & ATOMIC REQUIREMENTS:
═══════════════════════════════════════
- Compound JD Requirements (e.g. "Experiment with Large Language Models (LLMs) and prompt engineering"):
  Extract atomic elements:
  1. "LLMs" (SKILL) -> evaluate separately (PRESENT via Gemini/SkillBridge).
  2. "Prompt Engineering" (SKILL) -> evaluate separately (NOT_DEMONSTRATED unless explicit in source).
  3. "Experiment with LLMs and prompt engineering" (RESPONSIBILITY) -> mark PARTIALLY_DEMONSTRATED with note: "LLM integration experience is demonstrated, but formal prompt engineering workflows are not explicitly shown."
- Alternative / OR Requirements (e.g. "Flask or FastAPI"):
  If candidate demonstrates either one (e.g. Flask), mark the requirement PRESENT. Do NOT mark FastAPI as a missing gap.

═══════════════════════════════════════
SPECIFIC TECHNICAL EVALUATION RULES:
═══════════════════════════════════════
- "Machine Learning" (SKILL) vs "Build and evaluate ML models for document processing" (RESPONSIBILITY):
  * "Machine Learning": Candidate has YOLOv8/OpenCV/Gemini/NLP project evidence -> classify as PRESENT or PARTIALLY_DEMONSTRATED based on depth.
  * "Build and evaluate ML models for document processing": Candidate does NOT have document processing ML training evidence -> classify as NOT_DEMONSTRATED with clear evidence note.
- "RAG" (SKILL) & "Develop simple RAG pipelines" (RESPONSIBILITY):
  * Mark "RAG" as primary requirement (status: MISSING).
  * Mark "Develop simple RAG pipelines" as related requirement (status: MISSING).
  * Include relatedRequirements: ["Develop simple RAG pipelines"] on the RAG object to prevent visual duplication.
- "Problem-Solving":
  * If inferred from development/debugging/projects, state evidence as: "Demonstrated through software development, debugging, and project work."
- Status Definitions:
  * "PRESENT": Clearly demonstrated in the candidate's resume/projects.
  * "PARTIALLY_DEMONSTRATED": Some evidence exists (e.g. foundational familiarity), but full depth is not demonstrated.
  * "NOT_DEMONSTRATED": Candidate has related knowledge/skills, but this specific item is not shown in the resume.
  * "MISSING": Completely absent with no related evidence.

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
3. "matchScore" — realistic integer 0–100 based strictly on verified candidate evidence.
4. "summary" — 2–3 short, simple sentences summarizing candidate fit.
5. "scoreExplanation" — object with:
   - "reasoning" — 2–3 simple, evidence-based sentences explaining the match score.
6. "skillClassification" — array of 10–18 objects for EVERY key requirement in the job description:
   - "requirement" — clear name of the requirement (e.g. "Python", "LLMs", "Prompt Engineering", "REST APIs", "Work with REST APIs to integrate AI services", "Machine Learning", "Build and evaluate ML models for document processing", "RAG", "Vector Databases", "Docker", "Git/GitHub").
   - "normalizedRequirement" — lowercase simplified string (e.g. "python", "rag", "docker").
   - "type" — exactly one of: "SKILL", "RESPONSIBILITY", "EDUCATION", "OTHER".
   - "status" — exactly one of: "PRESENT", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED", "MISSING".
   - "evidence" — 1 concise, factual sentence citing the exact project/internship or explaining why it is missing.
   - "reason" — 1 short sentence explaining why this status was assigned.
   - "relatedRequirements" — array of strings containing any duplicate or sub-requirements (e.g. ["Develop simple RAG pipelines"]).`;
}

module.exports = {
    buildResumeAnalysisPrompt
};
