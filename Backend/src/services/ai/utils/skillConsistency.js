/**
 * Skill & Requirement Consistency Utility
 * 
 * Ensures single source of truth for:
 * - skillClassification
 * - strongSkills
 * - weakSkills / partialSkills / notDemonstrated
 * - missingKeywords
 * - scoreExplanation
 * - nextSteps
 */

const KNOWN_ALIASES = {
    "react native": "React Native",
    "reactnative": "React Native",
    "react-native": "React Native",
    "typescript": "TypeScript",
    "types-script": "TypeScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "javascript (es6+)": "JavaScript",
    "js": "JavaScript",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node js": "Node.js",
    "node": "Node.js",
    "express.js": "Express.js",
    "expressjs": "Express.js",
    "express": "Express.js",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful api": "REST APIs",
    "restful apis": "REST APIs",
    "rest": "REST APIs",
    "rag": "RAG (Retrieval-Augmented Generation)",
    "rag pipelines": "RAG (Retrieval-Augmented Generation)",
    "retrieval augmented generation": "RAG (Retrieval-Augmented Generation)",
    "google gemini": "Google Gemini API",
    "google gemini api": "Google Gemini API",
    "gemini api": "Google Gemini API",
    "docker": "Docker",
    "containerization": "Docker",
    "git": "Git & Version Control",
    "git/github": "Git & Version Control",
    "github": "Git & Version Control",
    "version control": "Git & Version Control",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tailwind css": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "redux": "Redux Toolkit",
    "redux toolkit": "Redux Toolkit",
    "rtk": "Redux Toolkit",
    "vector db": "Vector Databases",
    "vector database": "Vector Databases",
    "vector databases": "Vector Databases",
    "postman": "Postman",
    "jest": "Jest",
    "cypress": "Cypress",
    "playwright": "Playwright",
    "selenium": "Selenium",
    "ci/cd": "CI/CD Pipelines",
    "ci cd": "CI/CD Pipelines",
    "cicd": "CI/CD Pipelines"
};

/**
 * Normalize requirement name
 */
function normalizeRequirementName(name) {
    if (!name || typeof name !== "string") return "";
    
    // Clean leading bullets, numbers, dashes
    let cleaned = name.replace(/^[\s•\-\*\d\.\)\:]+/, "").trim();
    
    const lower = cleaned.toLowerCase();
    if (KNOWN_ALIASES[lower]) {
        return KNOWN_ALIASES[lower];
    }
    
    // Capitalize first letter of each word if not all caps
    if (cleaned.length > 0 && cleaned !== cleaned.toUpperCase()) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    return cleaned;
}

/**
 * Normalize item status
 */
function normalizeStatus(status) {
    const s = String(status || "").toUpperCase().trim().replace(/[\s\-]+/g, "_");
    if (s.includes("PRESENT")) return "PRESENT";
    if (s.includes("PARTIAL")) return "PARTIALLY_DEMONSTRATED";
    if (s.includes("NOT_DEMONSTRATED") || s.includes("NOT_SHOWN") || s.includes("UNVERIFIED")) return "NOT_DEMONSTRATED";
    return "MISSING";
}

/**
 * Normalize item type
 */
function normalizeType(type) {
    const t = String(type || "").toUpperCase().trim();
    if (t.includes("RESPONSIBIL")) return "RESPONSIBILITY";
    if (t.includes("EXPERIENCE")) return "EXPERIENCE";
    return "SKILL";
}

/**
 * Single source of truth enforcement
 */
function enforceSkillConsistency(resumeAnalysis) {
    if (!resumeAnalysis) return resumeAnalysis;

    const rawList = Array.isArray(resumeAnalysis.skillClassification) ? resumeAnalysis.skillClassification : [];
    
    const seen = new Set();
    const normalizedClassification = [];

    rawList.forEach(item => {
        const rawName = item.requirement || item.skill || "";
        const name = normalizeRequirementName(rawName);
        if (!name) return;

        const key = name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        const status = normalizeStatus(item.status);
        const type = normalizeType(item.type);
        const evidence = item.evidence || item.reason || (
            status === "PRESENT" ? `Demonstrated in candidate resume/projects.` :
            status === "PARTIALLY_DEMONSTRATED" ? `Foundational familiarity mentioned, but deeper hands-on depth needed.` :
            status === "NOT_DEMONSTRATED" ? `Related experience present, but this specific requirement was not directly shown.` :
            `No direct evidence or experience found in the resume.`
        );

        normalizedClassification.push({
            requirement: name,
            skill: name, // for backward compatibility
            status,
            type,
            evidence
        });
    });

    // Derive deterministic groupings strictly from classification
    const presentItems = normalizedClassification.filter(i => i.status === "PRESENT");
    const partialItems = normalizedClassification.filter(i => i.status === "PARTIALLY_DEMONSTRATED");
    const notDemonstratedItems = normalizedClassification.filter(i => i.status === "NOT_DEMONSTRATED");
    const missingItems = normalizedClassification.filter(i => i.status === "MISSING");

    const strongSkills = presentItems.map(i => i.requirement);
    const partialSkills = partialItems.map(i => i.requirement);
    const notDemonstratedSkills = notDemonstratedItems.map(i => i.requirement);
    const missingKeywords = missingItems.map(i => i.requirement);
    const weakSkills = [...partialSkills, ...notDemonstratedSkills];

    // Derive concise score explanation bullets from evidence (1 idea per bullet, simple English)
    const formatBullet = (item) => {
        const ev = (item.evidence || '').trim().replace(/^[\s•\-\*]+/, '');
        // Keep evidence concise (max 100 chars per bullet)
        const shortEv = ev.length > 90 ? `${ev.substring(0, 87)}...` : ev;
        return shortEv ? `${item.requirement}: ${shortEv}` : item.requirement;
    };

    const strengthsBullets = presentItems.slice(0, 6).map(formatBullet);
    const partialBullets = partialItems.slice(0, 5).map(formatBullet);
    const notDemonstratedBullets = notDemonstratedItems.slice(0, 5).map(formatBullet);
    const missingBullets = missingItems.slice(0, 5).map(formatBullet);
    const gapsBullets = [...notDemonstratedBullets, ...missingBullets].slice(0, 6);

    const scoreExplanation = {
        strengths: strengthsBullets,
        partial: partialBullets,
        notDemonstrated: notDemonstratedBullets,
        missing: missingBullets,
        gaps: gapsBullets,
        reasoning: (resumeAnalysis.scoreExplanation?.reasoning || '').trim() || 
            `Candidate achieved a ${resumeAnalysis.matchScore || 75}% match score based on ${presentItems.length} demonstrated requirements, ${partialItems.length} partial competencies, and ${notDemonstratedItems.length + missingItems.length} gap areas.`
    };

    // Derive 3-5 concrete next steps
    const nextSteps = [];
    if (missingItems.length > 0) {
        nextSteps.push(`Learn core fundamentals of ${missingItems.slice(0, 2).map(i => i.requirement).join(" and ")}.`);
    }
    if (partialItems.length > 0) {
        nextSteps.push(`Deepen practical hands-on projects involving ${partialItems.slice(0, 2).map(i => i.requirement).join(" and ")}.`);
    }
    if (notDemonstratedItems.length > 0) {
        nextSteps.push(`Prepare specific STAR stories highlighting experience in ${notDemonstratedItems.slice(0, 2).map(i => i.requirement).join(" and ")}.`);
    }
    nextSteps.push(`Review the 15-day preparation roadmap and practice the 20 technical and 15 MCQ practice questions.`);

    return {
        ...resumeAnalysis,
        strongSkills,
        weakSkills,
        missingKeywords,
        scoreExplanation,
        skillClassification: normalizedClassification,
        nextSteps
    };
}

module.exports = {
    normalizeRequirementName,
    normalizeStatus,
    normalizeType,
    enforceSkillConsistency
};
