function buildProjectRecommendationsPrompt({
    resume,
    selfDescription,
    jobDescription,
    selectedTrack,
    skillClassification,
    summary,
    targetRole,
    company
}) {
    const trackContext = selectedTrack
        ? `\nSELECTED TARGET ROLE / TRACK: ${selectedTrack}\n`
        : targetRole
            ? `\nTARGET ROLE: ${targetRole}\n`
            : "";

    const companyContext = company ? `TARGET COMPANY: ${company}\n` : "";

    // Extract gaps from skillClassification
    const gaps = (skillClassification || [])
        .filter(item => item.status === "MISSING" || item.status === "NOT_DEMONSTRATED" || item.status === "PARTIALLY_DEMONSTRATED")
        .map(item => `${item.requirement || item.skill} (${item.type || 'SKILL'} - ${item.status})`);

    const strengths = (skillClassification || [])
        .filter(item => item.status === "PRESENT")
        .map(item => `${item.requirement || item.skill}`);

    return `You are an elite technical career coach and hiring manager.

Your task is to recommend EXACTLY 4 HIGH-VALUE, REAL-WORLD, PRACTICAL PROJECTS tailored specifically for this candidate and this target role.

═══════════════════════════════════════
TARGET ROLE & CONTEXT
═══════════════════════════════════════
${trackContext}${companyContext}
TARGET JOB DESCRIPTION:
${jobDescription}

═══════════════════════════════════════
CANDIDATE PROFILE & EVIDENCE
═══════════════════════════════════════
CANDIDATE RESUME (SOURCE OF TRUTH):
${resume || "No formal resume provided."}

CANDIDATE SELF-DESCRIPTION / PROFILE:
${selfDescription || "Not provided."}

ANALYSIS SUMMARY:
${summary || "Student candidate preparing for role."}

DEMONSTRATED CANDIDATE STRENGTHS (ALREADY PRESENT):
${strengths.length > 0 ? strengths.join(", ") : "Fundamentals"}

IDENTIFIED JD GAPS & PARTIAL AREAS TO TARGET:
${gaps.length > 0 ? gaps.join("; ") : "Deepen production workflows"}

═══════════════════════════════════════
CRITICAL GENERATION RULES
═══════════════════════════════════════

1. ROLE-SPECIFIC & JD-GROUNDED:
   - The projects MUST be directly inspired by the target job description and target role.
   - For Full Stack: focus on multi-user platforms, real-time collaboration, secure booking/e-commerce, REST/GraphQL APIs, auth, databases.
   - For Data Analyst: focus on sales intelligence, customer churn analytics, demand forecasting, KPI dashboards, SQL/Pandas pipelines.
   - For AI / ML Intern: focus on document intelligence, classification/evaluation pipelines, RAG assistants, model monitoring.
   - For Backend: focus on order processing engines, event-driven services, auth/rate-limiting services, API observability platforms.
   - For Frontend: focus on analytics dashboards, design systems, accessible productivity tools, client-state caching apps.
   - DO NOT recommend the same generic AI projects for non-AI roles!

2. CANDIDATE-AWARE:
   - Build on the candidate's existing strengths while introducing the missing JD requirements.
   - If candidate knows Python/Flask and needs RAG + Docker, recommend a project combining Python/Flask with RAG and Docker.
   - If candidate knows React/Node and needs SQL/Auth, recommend a project expanding their full-stack capabilities into SQL and secure Auth.

3. DIVERSITY ACROSS THE 4 PROJECTS:
   - Project 01: Primary JD-critical gap & core role capability.
   - Project 02: Different core responsibility & business workflow.
   - Project 03: Different technical capability / stack layer.
   - Project 04: Practical business problem / portfolio differentiator.
   - The 4 projects MUST solve 4 completely distinct real-world problems. DO NOT create 4 variations of a chatbot or 4 CRUD dashboards!

4. REAL-WORLD PROBLEM MANDATE:
   - Every project must clearly answer:
     * WHO has the problem? (e.g. Customer Support Team, Operations Manager, Healthcare Staff, Retail Inventory Team, Financial Analysts)
     * WHAT is the pain point?
     * WHY does solving it matter?

5. COMPLETABLE & RESUME-WORTHY:
   - Scope: Realistic for a student/intern (3–10 days / 1–2 weeks).
   - Core features: 4–7 practical, achievable features.
   - Key skills: 5–8 targeted skills.

6. NO FABRICATED METRICS:
   - In "resumeBoost", describe what the candidate can demonstrate and provide a draft resume bullet.
   - NEVER invent fake performance numbers (e.g., "achieved 98% accuracy", "reduced latency by 45%").
   - Instead, instruct: "Measure response latency and record actual result after testing."

═══════════════════════════════════════
OUTPUT JSON STRUCTURE
═══════════════════════════════════════

Return a JSON object matching this schema:
{
  "whyTheseProjects": "2-3 sentences explaining why this specific 4-project curriculum was selected based on the candidate's gaps and the target JD requirements.",
  "projects": [
    {
      "num": "01",
      "name": "Specific, non-generic project title",
      "icon": "Relevant emoji (e.g. 📊, ⚡, 🚀, 🛡️, 🔍, 🐳)",
      "targetRole": "${targetRole || 'Target Role'}",
      "realWorldProblem": "1-3 sentences: Who has the problem, what is the pain point, and why it matters.",
      "whatYouBuild": "3-5 sentences explaining the solution clearly.",
      "responsibilities": [
        "4-6 practical, hands-on tasks to build this project"
      ],
      "skills": [
        "5-8 key technologies and methodologies demonstrated"
      ],
      "whyThisProject": "Explicit explanation of which JD requirements it addresses and which candidate gaps it fixes.",
      "suggestedFeatures": [
        "4-7 practical, buildable features"
      ],
      "resumeBoost": "How this project transforms resume evidence with a template bullet (e.g. 'Built an end-to-end [system] using [tech stack], enabling [capability]. Measure and record actual [metric] after testing.').",
      "expectedEvidence": [
        "GitHub repository with clean modular code",
        "README with architecture diagram and setup instructions",
        "Live interactive demo or demo recording",
        "Benchmark test results"
      ],
      "estimatedDuration": "5-7 days",
      "difficulty": "Intermediate",
      "jdRequirementsCovered": ["Requirement 1", "Requirement 2"],
      "candidateGapsAddressed": ["Gap 1", "Gap 2"],
      "roadmapConnections": ["Day 1-3 Fundamentals", "Day 4-6 Implementation"],
      "canonicalSkillIds": ["skill-id-1", "skill-id-2"]
    },
    ... (total exactly 4 projects: 01, 02, 03, 04)
  ]
}`;
}

module.exports = {
    buildProjectRecommendationsPrompt
};
