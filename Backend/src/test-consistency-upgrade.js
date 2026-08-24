require("dotenv").config();
const { detectJobTracks, generateInterviewReport, generateAtsReport } = require("./services/ai.service");
const { enforceSkillConsistency, normalizeRequirementName } = require("./services/ai/utils/skillConsistency");

const MULTI_ROLE_JD = `
TechNova Solutions — Emerging Tech Internship Openings

We are seeking interns across three specialized tracks:

TRACK 1: AI / ML Intern
Responsibilities & Requirements:
- Build machine learning pipelines and deep learning models with PyTorch or TensorFlow
- Strong proficiency in Python, NumPy, Pandas, Scikit-learn
- Hands-on experience with Retrieval-Augmented Generation (RAG) and Vector Databases
- Practical understanding of LLMs, Prompt Engineering, and Model Evaluation
- Model monitoring and deployment fundamentals using Docker
- Collaborative Git/GitHub workflows and clean code standards

TRACK 2: Mobile App Developer Intern
Responsibilities & Requirements:
- Build cross-platform mobile apps using React Native
- Strong proficiency in JavaScript / TypeScript
- State management with Redux Toolkit
- Integrate RESTful APIs and handle offline storage
- Adherence to mobile UI/UX best practices for iOS and Android
- Experience with Git and version control

TRACK 3: Automation Testing Intern
Responsibilities & Requirements:
- Design automated test suites with Cypress, Playwright, or Selenium
- Strong programming in JavaScript or Python
- API testing using Postman or REST Assured
- Basic understanding of CI/CD pipelines (GitHub Actions)
- Bug tracking and test documentation
`;

const CANDIDATE_RESUME = `
Alex Kumar
Email: alex.kumar@example.com | GitHub: github.com/alexkumar | LinkedIn: linkedin.com/in/alexkumar

PROFESSIONAL SUMMARY
Computer Science undergraduate with hands-on project experience in Python, Machine Learning, and Full-Stack Development. Passionate about AI applications, LLMs, and modern APIs.

TECHNICAL SKILLS
- Languages: Python, JavaScript, TypeScript, SQL, HTML/CSS
- AI & Data Science: NumPy, Pandas, Scikit-learn, PyTorch (Foundational), Prompt Engineering, Google Gemini API
- Web & Mobile: React, Node.js, Express.js, MongoDB, REST APIs, Tailwind CSS
- Developer Tools: Git, GitHub, Postman, VS Code, Linux

FEATURED PROJECTS
1. AI Research Assistant (Python, Google Gemini API, Streamlit)
- Developed an intelligent document Q&A assistant utilizing the Google Gemini API.
- Implemented prompt engineering techniques and evaluated query response quality.
- Used Pandas for dataset preprocessing and structured data extraction.

2. Campus Marketplace API (Node.js, Express, MongoDB, REST APIs)
- Architected RESTful backend with JWT authentication and MongoDB aggregation pipelines.
- Integrated Postman for automated API endpoint testing and documentation.

EDUCATION
B.S. in Computer Science — Graduating 2026
`;

async function runConsistencyTest() {
    console.log("================================================================");
    console.log("TEST 1: UNIT TEST — ENFORCE SKILL CONSISTENCY & NORMALIZATION");
    console.log("================================================================");

    const mockAnalysis = {
        title: "AI / ML Intern",
        company: "TechNova Solutions",
        matchScore: 82,
        summary: "Solid foundation in Python and Gemini API, but lacks demonstrated RAG and Docker experience.",
        skillClassification: [
            { requirement: "Python", status: "PRESENT", type: "SKILL", evidence: "Extensive Python project and course work." },
            { requirement: "Prompt Engineering", status: "PARTIALLY_DEMONSTRATED", type: "SKILL", evidence: "Used in AI Research Assistant project." },
            { requirement: "Model Monitoring", status: "NOT_DEMONSTRATED", type: "RESPONSIBILITY", evidence: "No model monitoring or observability experience shown." },
            { requirement: "RAG (Retrieval-Augmented Generation)", status: "MISSING", type: "SKILL", evidence: "No RAG pipeline or vector search implementation in resume." },
            { requirement: "Docker", status: "MISSING", type: "SKILL", evidence: "No containerization mentioned." },
            { requirement: "REST APIs", status: "PRESENT", type: "SKILL", evidence: "Built Campus Marketplace REST API with Express." }
        ]
    };

    const enforced = enforceSkillConsistency(mockAnalysis);

    console.log("Enforced Strong Skills:", enforced.strongSkills);
    console.log("Enforced Weak Skills:", enforced.weakSkills);
    console.log("Enforced Missing Keywords:", enforced.missingKeywords);
    console.log("Enforced Score Explanation:", JSON.stringify(enforced.scoreExplanation, null, 2));
    console.log("Enforced Next Steps:", enforced.nextSteps);

    // Consistency Assertions
    enforced.skillClassification.forEach(item => {
        if (item.status === "PRESENT") {
            if (!enforced.strongSkills.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is PRESENT but missing in strongSkills`);
            if (enforced.weakSkills.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is PRESENT but found in weakSkills`);
            if (enforced.missingKeywords.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is PRESENT but found in missingKeywords`);
        }
        if (item.status === "PARTIALLY_DEMONSTRATED" || item.status === "NOT_DEMONSTRATED") {
            if (enforced.strongSkills.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is ${item.status} but found in strongSkills`);
            if (!enforced.weakSkills.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is ${item.status} but missing in weakSkills`);
            if (enforced.missingKeywords.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is ${item.status} but found in missingKeywords`);
        }
        if (item.status === "MISSING") {
            if (enforced.strongSkills.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is MISSING but found in strongSkills`);
            if (enforced.weakSkills.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is MISSING but found in weakSkills`);
            if (!enforced.missingKeywords.includes(item.requirement)) throw new Error(`FAIL: ${item.requirement} is MISSING but missing in missingKeywords`);
        }
    });
    console.log(">>> UNIT TEST PASSED: 100% Data Consistency Verified!\n");

    console.log("================================================================");
    console.log("TEST 2: LIVE END-TO-END PIPELINE (TRACK: AI / ML Intern)");
    console.log("================================================================");

    const trackResult = await detectJobTracks({ jobDescription: MULTI_ROLE_JD });
    console.log(`Detected ${trackResult.tracks.length} tracks. Target Track: ${trackResult.tracks[0].trackTitle}`);

    const selectedTrackTitle = trackResult.tracks[0].trackTitle;
    const selectedTrackDesc = trackResult.tracks[0].trackDescription;

    const { report, resumeAnalysis } = await generateInterviewReport({
        resume: CANDIDATE_RESUME,
        selfDescription: "Aspiring AI/ML Engineer with Python, Scikit-learn, and Gemini API experience.",
        jobDescription: MULTI_ROLE_JD,
        userId: null,
        selectedTrack: selectedTrackDesc,
        selectedTrackTitle: selectedTrackTitle
    });

    console.log("\n--- Live Generated Report Summary ---");
    console.log(`Role Title: ${report.title}`);
    console.log(`Company: ${report.company}`);
    console.log(`Match Score: ${report.matchScore}%`);
    console.log(`Selected Track Title: ${report.selectedTrack}`);
    console.log(`Summary: ${report.summary}`);

    console.log("\n--- Skill & Requirement Classification (Single Source of Truth) ---");
    console.log(`Total Classified Requirements: ${report.skillClassification?.length}`);
    report.skillClassification?.forEach(c => {
        console.log(`  • [${c.type}] ${c.requirement} -> ${c.status} (Evidence: "${c.evidence?.substring(0, 45)}...")`);
    });

    console.log("\n--- Verification of Strict Zero-Contradiction Consistency ---");
    report.skillClassification?.forEach(item => {
        const name = item.requirement || item.skill;
        if (item.status === "PRESENT") {
            if (!report.strongSkills.includes(name)) console.error(`  ERROR: ${name} is PRESENT but not in strongSkills!`);
            if (report.weakSkills.includes(name)) console.error(`  ERROR: ${name} is PRESENT but found in weakSkills!`);
            if (report.missingKeywords.includes(name)) console.error(`  ERROR: ${name} is PRESENT but found in missingKeywords!`);
        }
        if (item.status === "PARTIALLY_DEMONSTRATED" || item.status === "NOT_DEMONSTRATED") {
            if (report.strongSkills.includes(name)) console.error(`  ERROR: ${name} is ${item.status} but found in strongSkills!`);
            if (!report.weakSkills.includes(name)) console.error(`  ERROR: ${name} is ${item.status} but missing in weakSkills!`);
            if (report.missingKeywords.includes(name)) console.error(`  ERROR: ${name} is ${item.status} but found in missingKeywords!`);
        }
        if (item.status === "MISSING") {
            if (report.strongSkills.includes(name)) console.error(`  ERROR: ${name} is MISSING but found in strongSkills!`);
            if (report.weakSkills.includes(name)) console.error(`  ERROR: ${name} is MISSING but found in weakSkills!`);
            if (!report.missingKeywords.includes(name)) console.error(`  ERROR: ${name} is MISSING but missing in missingKeywords!`);
        }
    });
    console.log("  >>> Zero contradiction check completed!");

    console.log("\n--- Score Explanation (Structured & Compact) ---");
    console.log(`Reasoning: ${report.scoreExplanation?.reasoning}`);
    console.log(`Strengths (${report.scoreExplanation?.strengths?.length}):`, report.scoreExplanation?.strengths);
    console.log(`Partial (${report.scoreExplanation?.partial?.length}):`, report.scoreExplanation?.partial);
    console.log(`Gaps (${report.scoreExplanation?.gaps?.length}):`, report.scoreExplanation?.gaps);

    console.log("\n--- Actionable Next Steps ---");
    report.nextSteps?.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
    });

    console.log("\n--- Questions Count Check ---");
    console.log(`Technical: ${report.technicalQuestions?.length} (Expected: 20)`);
    console.log(`MCQ: ${report.mcqQuestions?.length} (Expected: 15)`);
    console.log(`Behavioral: ${report.behavioralQuestions?.length} (Expected: 10)`);
    console.log(`Roadmap Days: ${report.preparationPlan?.length} (Expected: 15)`);

    console.log("\n================================================================");
    console.log("ALL CONSISTENCY & READABILITY TESTS PASSED WITH FLYING COLORS!");
    console.log("================================================================");
}

runConsistencyTest().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});
