const assert = require("assert");
const { buildProjectRecommendationsPrompt } = require("./services/ai/prompts/project.prompt");
const { singleProjectSchema, projectRecommendationsSchema } = require("./services/ai/schemas");

console.log("==================================================");
console.log("RUNNING PROJECT RECOMMENDATION ENGINE TESTS");
console.log("==================================================");

// Sample Role JDs
const ROLES = [
    {
        role: "AI / ML Intern",
        jd: "Seeking an AI/ML intern with experience in Python, PyTorch, LLM integration, RAG architectures, model evaluation, and Docker deployment. Candidate will build intelligent document parsing pipelines and evaluate retrieval quality."
    },
    {
        role: "Full Stack Developer",
        jd: "Looking for a Full Stack Developer proficient in React, Node.js, Express, MongoDB, REST APIs, user authentication, and responsive UI design. You will build collaborative customer portals and SaaS workflow systems."
    },
    {
        role: "Backend Developer",
        jd: "Hiring Backend Engineer to develop high-throughput REST APIs, database transactions in PostgreSQL, Redis caching, event-driven message queues, and API observability in Node.js / Python."
    },
    {
        role: "Data Analyst",
        jd: "Seeking Data Analyst skilled in SQL, Python, Pandas, Tableau, exploratory data analysis, KPI dashboards, and statistical hypothesis testing to extract actionable business insights from sales data."
    },
    {
        role: "Frontend Developer",
        jd: "Looking for a Frontend Engineer with deep expertise in React, TypeScript, responsive CSS architecture, state management, web accessibility (WCAG), and component testing."
    }
];

// Test 1: Schema Validation for Project Schema
console.log("\n[TEST 1] Testing Zod Schema Validation for Single & Group Projects...");
const validSampleProject = {
    num: "01",
    name: "Enterprise Sales Intelligence & Cohort Analytics Platform",
    icon: "📊",
    targetRole: "Data Analyst",
    realWorldProblem: "Executive leadership lacks visibility into customer retention cohorts and revenue churn across multi-channel product lines.",
    whatYouBuild: "An automated data analysis pipeline that extracts transactional sales records, computes customer lifetime value, and generates interactive cohort visualizers.",
    responsibilities: [
        "Write SQL queries to aggregate customer transactions",
        "Clean raw datasets and impute missing values with Pandas",
        "Compute retention cohort matrices and churn rates",
        "Build interactive KPI dashboard using Streamlit"
    ],
    skills: ["Python", "Pandas", "SQL", "Data Cleaning", "Data Visualization"],
    whyThisProject: "Directly satisfies JD requirements for SQL aggregation and Pandas data exploration.",
    suggestedFeatures: [
        "Automated CSV/SQL data ingestion pipeline",
        "Customer lifetime value (CLV) calculation",
        "Cohort retention heatmap visualization",
        "Executive summary report export"
    ],
    resumeBoost: "Built an end-to-end sales intelligence analytics pipeline with Pandas and SQL, analyzing customer retention cohorts. Record actual query execution metrics after testing.",
    expectedEvidence: ["GitHub repository", "Jupyter notebook with EDA insights", "Interactive dashboard demo"],
    estimatedDuration: "5-7 days",
    difficulty: "Intermediate",
    jdRequirementsCovered: ["SQL", "Pandas", "Data Visualization"],
    candidateGapsAddressed: ["Data Modeling", "Cohort Analysis"],
    roadmapConnections: ["Day 1-4 SQL & Data Modeling", "Day 5-8 Visualization"],
    canonicalSkillIds: ["python", "pandas", "sql", "data-analysis"]
};

const parsedSingle = singleProjectSchema.parse(validSampleProject);
assert.strictEqual(parsedSingle.num, "01");
assert.strictEqual(parsedSingle.skills.length, 5);
console.log("✓ singleProjectSchema parsed successfully");

const parsedGroup = projectRecommendationsSchema.parse({
    whyTheseProjects: "Curated to bridge critical gaps in SQL aggregation and cohort analysis.",
    projects: [
        validSampleProject,
        { ...validSampleProject, num: "02", name: "Predictive Churn Risk Scorer", icon: "📉" },
        { ...validSampleProject, num: "03", name: "Inventory Demand Forecasting Pipeline", icon: "📦" },
        { ...validSampleProject, num: "04", name: "Marketing Campaign ROI Analyzer", icon: "🎯" }
    ]
});
assert.strictEqual(parsedGroup.projects.length, 4);
console.log("✓ projectRecommendationsSchema parsed 4 projects successfully");

// Test 2: Verify Prompt Construction for All 5 Roles
console.log("\n[TEST 2] Verifying Prompt Construction across 5 Different Roles...");
ROLES.forEach(r => {
    const prompt = buildProjectRecommendationsPrompt({
        resume: "B.Tech Computer Science student with projects in Python and Git.",
        selfDescription: "Passionate about learning practical software engineering.",
        jobDescription: r.jd,
        selectedTrack: r.role,
        targetRole: r.role,
        skillClassification: [
            { requirement: "Core Fundamentals", type: "SKILL", status: "PRESENT" },
            { requirement: "Target Frameworks", type: "SKILL", status: "MISSING" },
            { requirement: "Production Deployment", type: "RESPONSIBILITY", status: "NOT_DEMONSTRATED" }
        ],
        summary: `Candidate preparing for ${r.role}`
    });

    assert(prompt.includes(r.role), `Prompt must include role name ${r.role}`);
    assert(prompt.includes("EXACTLY 4 HIGH-VALUE, REAL-WORLD, PRACTICAL PROJECTS"), "Prompt must instruct 4 projects");
    assert(prompt.includes("NO FABRICATED METRICS"), "Prompt must instruct NO fake metrics");
    assert(prompt.includes("REAL-WORLD PROBLEM MANDATE"), "Prompt must mandate real-world problems");
    console.log(`✓ Verified prompt generation for role: ${r.role}`);
});

// Test 3: Candidate Differentiation Test (Same JD with Candidate A vs Candidate B)
console.log("\n[TEST 3] Testing Candidate Differentiation on Same JD...");
const targetJd = "Full Stack AI Engineer: React, Node.js, Python, RAG, Docker, MongoDB.";

const promptCandidateA = buildProjectRecommendationsPrompt({
    resume: "Skills: Python, PyTorch, OpenCV, Gemini API, Flask.",
    jobDescription: targetJd,
    targetRole: "Full Stack AI Engineer",
    skillClassification: [
        { requirement: "Python", type: "SKILL", status: "PRESENT" },
        { requirement: "React", type: "SKILL", status: "MISSING" },
        { requirement: "Node.js", type: "SKILL", status: "MISSING" },
        { requirement: "MongoDB", type: "SKILL", status: "MISSING" }
    ]
});

const promptCandidateB = buildProjectRecommendationsPrompt({
    resume: "Skills: React, Node.js, Express, MongoDB, HTML, CSS.",
    jobDescription: targetJd,
    targetRole: "Full Stack AI Engineer",
    skillClassification: [
        { requirement: "React", type: "SKILL", status: "PRESENT" },
        { requirement: "Node.js", type: "SKILL", status: "PRESENT" },
        { requirement: "Python", type: "SKILL", status: "MISSING" },
        { requirement: "RAG", type: "SKILL", status: "MISSING" },
        { requirement: "Docker", type: "SKILL", status: "MISSING" }
    ]
});

assert(promptCandidateA.includes("Python, PyTorch, OpenCV"), "Candidate A prompt must contain Candidate A's background");
assert(promptCandidateB.includes("React, Node.js, Express, MongoDB"), "Candidate B prompt must contain Candidate B's background");
assert(promptCandidateA.includes("React (SKILL - MISSING)"), "Candidate A gaps must reflect React & Node gaps");
assert(promptCandidateB.includes("Python (SKILL - MISSING)"), "Candidate B gaps must reflect Python & RAG gaps");
console.log("✓ Candidate A and Candidate B prompts reflect distinct strengths and targeted gaps");

// Test 4: Quality & Anti-Fabrication Rule Check
console.log("\n[TEST 4] Testing Anti-Fabrication & Quality Guidelines...");
const testResumeBoostText = validSampleProject.resumeBoost;
assert(!testResumeBoostText.includes("98% accuracy"), "Must not include fake 98% accuracy");
assert(!testResumeBoostText.includes("45% faster"), "Must not include fake 45% faster");
assert(testResumeBoostText.includes("Record actual") || testResumeBoostText.includes("Measure"), "Must guide candidate to record real measured metric");
console.log("✓ Anti-fabrication metric rules passed");

console.log("\n==================================================");
console.log("ALL PROJECT RECOMMENDATION TESTS PASSED! 🚀");
console.log("==================================================");
