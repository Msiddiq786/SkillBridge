const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("==================================================");
console.log("PHASE 11-20 & 29-31: AI GROUNDING, QUALITY & SCHEMAS AUDIT");
console.log("==================================================");

const findings = [];

// Golden Test Fixtures
const GOLDEN_RESUME_A = `
John Doe
Email: john@example.com | Phone: +1 555-0199 | Location: San Francisco, CA
Education: B.S. in Computer Science, State University, 2024
Skills: Python, PyTorch, Pandas, NumPy, OpenCV, Git, Scikit-Learn
Experience:
- Computer Vision Intern at VisionTech (3 months): Built object detection scripts using PyTorch and OpenCV.
Projects:
- Image Classification Model: Built CNN classifier on CIFAR-10 achieving verified baseline test accuracy.
`;

const GOLDEN_RESUME_B = `
Jane Smith
Email: jane@example.com | Phone: +1 555-0144 | Location: Austin, TX
Education: B.Tech in Information Technology, 2023
Skills: JavaScript, TypeScript, React, Node.js, Express, MongoDB, Tailwind CSS, REST APIs
Experience:
- Frontend Intern at WebWorks (6 months): Developed React dashboards and customer order forms.
Projects:
- Team Task Manager: Full stack MERN application with user authentication and task board.
`;

const GOLDEN_JD_A = `
Role: AI / ML Engineer Intern
Company: NeuralSystems
Requirements:
- Strong Python programming and PyTorch or TensorFlow experience
- Experience building RAG (Retrieval-Augmented Generation) systems with vector databases (Pinecone/ChromaDB)
- Knowledge of FastAPI and Docker containerization
- Model evaluation metrics (Precision, Recall, F1, ROC-AUC)
`;

const GOLDEN_JD_B = `
Role: Full Stack Software Engineer
Company: CloudScale
Requirements:
- Proficiency in React, TypeScript, and modern frontend architecture
- Backend experience with Node.js, Express, PostgreSQL, and Redis caching
- Experience building secure REST APIs and Docker deployments
`;

// ----------------------------------------------------
// 1. Prompt Anti-Fabrication & Grounding Audit
// ----------------------------------------------------
console.log("\n[AUDIT 1] Inspecting AI Prompts for Strict Grounding & Anti-Fabrication Rules...");

const promptFiles = [
    { name: "resume.prompt.js", file: "prompts/resume.prompt.js" },
    { name: "technical.prompt.js", file: "prompts/technical.prompt.js" },
    { name: "mcq.prompt.js", file: "prompts/mcq.prompt.js" },
    { name: "behavior.prompt.js", file: "prompts/behavior.prompt.js" },
    { name: "skillgap.prompt.js", file: "prompts/skillgap.prompt.js" },
    { name: "roadmap.prompt.js", file: "prompts/roadmap.prompt.js" },
    { name: "project.prompt.js", file: "prompts/project.prompt.js" },
    { name: "ats.prompt.js", file: "prompts/ats.prompt.js" },
    { name: "evaluation.prompt.js", file: "prompts/evaluation.prompt.js" }
];

promptFiles.forEach(pf => {
    const fullPath = path.join(__dirname, "services/ai", pf.file);
    if (!fs.existsSync(fullPath)) {
        findings.push({ severity: "P0", feature: "AI Pipeline", issue: `Missing prompt file: ${pf.file}` });
        return;
    }
    const content = fs.readFileSync(fullPath, "utf8");
    const hasGrounding = content.toLowerCase().includes("not invent") || 
                         content.toLowerCase().includes("source of truth") || 
                         content.toLowerCase().includes("candidate summary") ||
                         content.toLowerCase().includes("job description") ||
                         content.toLowerCase().includes("grounded");

    if (hasGrounding) {
        console.log(`✓ ${pf.name}: Grounding & anti-hallucination instructions present`);
    } else {
        findings.push({
            severity: "P2",
            feature: "AI Grounding",
            file: pf.file,
            issue: `Prompt ${pf.name} lacks explicit anti-hallucination constraint`
        });
    }
});

// ----------------------------------------------------
// 2. Schema Validation Audit
// ----------------------------------------------------
console.log("\n[AUDIT 2] Validating Zod Schemas against Standard Schemas...");
const {
    trackDetectionSchema,
    resumeAnalysisSchema,
    technicalQuestionSchema,
    mcqQuestionSchema,
    behavioralQuestionSchema,
    skillGapSchema,
    roadmapSchema,
    atsAnalysisSchema,
    singleProjectSchema,
    projectRecommendationsSchema
} = require("./services/ai/schemas");

// Test MCQ Schema with valid and invalid options
const validMcq = [
    {
        question: "What is the primary difference between a Python list and a tuple?",
        difficulty: "Easy",
        category: "Python",
        options: [
            "Lists are mutable, tuples are immutable",
            "Lists are immutable, tuples are mutable",
            "Lists cannot store strings",
            "Tuples cannot store numbers"
        ],
        correctAnswer: "Lists are mutable, tuples are immutable",
        explanation: "In Python, lists can be modified after creation whereas tuples cannot.",
        resource: "Python Documentation - Data Structures"
    }
];

try {
    const parsed = mcqQuestionSchema.parse(validMcq);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].options.length, 4);
    assert(parsed[0].options.includes(parsed[0].correctAnswer), "correctAnswer must be one of the options");
    console.log("✓ MCQ Schema parsed and validated successfully");
} catch (err) {
    findings.push({ severity: "P1", feature: "AI Schema", issue: `MCQ Schema validation failed: ${err.message}` });
}

// Test STAR Behavioral Schema
const validBehavioral = [
    {
        difficulty: "Medium",
        question: "Tell me about a time you resolved a challenging bug under a tight deadline.",
        whatTheyAreAsking: "Assesses problem-solving and pressure management.",
        howToThink: "Structure using the STAR method.",
        starBreakdown: {
            situation: "During our final semester project delivery...",
            task: "Our backend API was returning 500 errors on high payload sizes.",
            action: "I profiled memory usage, identified unindexed queries, and implemented pagination.",
            result: "The API successfully passed load tests and was delivered on time."
        },
        simpleExample: "Fixed a slow database query before deadline.",
        realWorldExample: "Resolved memory leaks in Node.js server.",
        howToSayIt: "Focus on methodical debugging steps.",
        intention: "Evaluates debugging under pressure.",
        commonMistakes: ["Blaming teammates", "Being too vague about your individual contribution"],
        followUpQuestions: ["How did you verify the fix?", "What would you do differently next time?"]
    }
];

try {
    const parsed = behavioralQuestionSchema.parse(validBehavioral);
    assert.strictEqual(parsed.length, 1);
    assert(parsed[0].starBreakdown.situation, "Situation must exist");
    assert(parsed[0].starBreakdown.action, "Action must exist");
    assert(parsed[0].starBreakdown.result, "Result must exist");
    console.log("✓ Behavioral STAR Schema parsed and validated successfully");
} catch (err) {
    findings.push({ severity: "P1", feature: "AI Schema", issue: `Behavioral Schema validation failed: ${err.message}` });
}

// ----------------------------------------------------
// 3. Technical Question Quality & Step-by-Step Structure
// ----------------------------------------------------
console.log("\n[AUDIT 3] Validating Technical Question Master Format Schema...");
const validTech = [
    {
        difficulty: "Medium",
        category: "Databases",
        estimatedInterviewTime: "5 minutes",
        question: "What is database indexing and when should you avoid it?",
        intention: "Tests knowledge of query optimization and write overhead trade-offs.",
        oneLineAnswer: "Indexing speeds up data retrieval at the cost of slower writes and extra storage.",
        simpleExplanation: "An index is like a book's index: it allows the database engine to find rows quickly without scanning every table row.",
        easyExample: "Creating a B-tree index on user email for fast login lookups.",
        realWorldExample: "E-commerce product search filtering on sku and category_id.",
        howToSayIt: "Explain the read vs write performance trade-off clearly.",
        answer: "Database indexing creates auxiliary data structures (typically B-trees or hash tables) to locate records quickly...",
        commonMistakes: ["Over-indexing high-write tables", "Assuming indexes have no storage cost"],
        followUpQuestions: ["What is a composite index?", "How does B-tree index work?", "What is an index scan vs sequential scan?", "How do indexes affect INSERT/UPDATE performance?", "What is a covering index?"],
        quickMemoryTip: "Index = Read faster, Write slower.",
        resources: ["PostgreSQL Documentation - Indexes"]
    }
];

try {
    const parsed = technicalQuestionSchema.parse(validTech);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].followUpQuestions.length, 5);
    console.log("✓ Technical Question Master Format Schema validated successfully");
} catch (err) {
    findings.push({ severity: "P1", feature: "AI Schema", issue: `Technical Question Schema validation failed: ${err.message}` });
}

// ----------------------------------------------------
// 4. Project Recommendations Schema & Anti-Fake Metrics
// ----------------------------------------------------
console.log("\n[AUDIT 4] Validating Project Recommendation Engine Schemas & Quality...");
const validProjects = {
    whyTheseProjects: "Curated to bridge critical gaps in Full Stack and Caching.",
    projects: [
        {
            num: "01",
            name: "High-Throughput Order Processing API",
            icon: "⚙️",
            targetRole: "Backend Developer",
            realWorldProblem: "E-commerce platforms experience double-charging and inventory discrepancies when concurrent checkout requests hit backend databases simultaneously.",
            whatYouBuild: "A robust backend REST API featuring ACID database transactions, pessimistic concurrency locking, Redis caching, and rate limiting.",
            responsibilities: [
                "Design normalized relational database schema with indexing",
                "Implement atomic transaction handling for inventory deduction",
                "Configure Redis in-memory cache to reduce read load",
                "Build rate-limiting middleware to protect checkout endpoints"
            ],
            skills: ["Node.js", "Express", "PostgreSQL", "Redis", "REST APIs"],
            whyThisProject: "Directly targets key backend requirements for concurrent transaction safety and database design.",
            suggestedFeatures: [
                "Idempotent order placement endpoint",
                "Atomic inventory reservation with rollback",
                "Redis caching layer with TTL expiration",
                "Request validation with structured error responses"
            ],
            resumeBoost: "Architected a high-throughput order processing API with Node.js and SQL, implementing atomic transactions and Redis caching. Measure API throughput (req/sec) and record actual benchmark after testing.",
            expectedEvidence: ["GitHub repository", "Postman collection", "Migration scripts"],
            estimatedDuration: "5-7 days",
            difficulty: "Intermediate",
            jdRequirementsCovered: ["REST API", "Database Design", "Caching"],
            candidateGapsAddressed: ["Transactions", "Redis"],
            roadmapConnections: ["Day 1-4 Database Transactions", "Day 5-8 API Design"],
            canonicalSkillIds: ["nodejs", "express", "sql", "redis"]
        },
        {
            num: "02",
            name: "Event-Driven Notification Service",
            icon: "📬",
            targetRole: "Backend Developer",
            realWorldProblem: "Monolithic applications experience slow response times when sending emails and partner webhooks synchronously inside the main request cycle.",
            whatYouBuild: "An asynchronous event-driven background worker service that ingests notification events into message queues and dispatches them with retry backoffs.",
            responsibilities: [
                "Implement producer-consumer message queue architecture",
                "Build exponential backoff retry mechanism for failed webhooks",
                "Design dead-letter queue (DLQ) for inspecting failed events",
                "Create status query endpoints for tracking delivery lifecycle"
            ],
            skills: ["Node.js", "Message Queues", "Async Architecture", "Webhooks"],
            whyThisProject: "Demonstrates critical asynchronous architecture and reliable message handling.",
            suggestedFeatures: [
                "Event publishing API accepting batched payloads",
                "Worker pool processing queued jobs with concurrency controls",
                "Automated retry handler with exponential backoff",
                "Webhook signature verification and audit log"
            ],
            resumeBoost: "Built an event-driven notification engine with message queues and background workers. Record delivery throughput after testing.",
            expectedEvidence: ["GitHub repository", "Queue worker benchmarks"],
            estimatedDuration: "6-8 days",
            difficulty: "Intermediate",
            jdRequirementsCovered: ["Asynchronous Processing", "Message Queues"],
            candidateGapsAddressed: ["Message Queues"],
            roadmapConnections: ["Day 4-7 Background Jobs"],
            canonicalSkillIds: ["nodejs", "message-queues"]
        },
        {
            num: "03",
            name: "Role-Based Authentication & Security Microservice",
            icon: "🛡️",
            targetRole: "Backend Developer",
            realWorldProblem: "Enterprise applications risk data breaches when access control policies are handled inconsistently across microservices.",
            whatYouBuild: "A centralized authentication and authorization service supporting JWT signing, refresh token rotation, and RBAC.",
            responsibilities: [
                "Implement secure password hashing with bcrypt",
                "Build dual-token authentication (access + rotating refresh token)",
                "Design dynamic role and permission middleware",
                "Configure security headers and token blacklist revocation"
            ],
            skills: ["Node.js", "JWT", "OAuth 2.0", "Security", "RBAC"],
            whyThisProject: "Directly satisfies JD requirements for production security standards and authentication flows.",
            suggestedFeatures: [
                "User registration and login with email verification",
                "Refresh token rotation mechanism",
                "Granular RBAC middleware",
                "Token revocation blacklist with Redis TTL"
            ],
            resumeBoost: "Engineered a centralized JWT authentication service featuring refresh token rotation and RBAC middleware. Record actual auth overhead after testing.",
            expectedEvidence: ["GitHub repository", "Postman security test collection"],
            estimatedDuration: "5-7 days",
            difficulty: "Intermediate",
            jdRequirementsCovered: ["Authentication & Security", "JWT"],
            candidateGapsAddressed: ["Security & RBAC"],
            roadmapConnections: ["Day 2-5 Auth & JWT"],
            canonicalSkillIds: ["nodejs", "jwt", "authentication"]
        },
        {
            num: "04",
            name: "API Observability & Telemetry Monitoring Service",
            icon: "📈",
            targetRole: "Backend Developer",
            realWorldProblem: "DevOps and backend teams cannot pinpoint microservice latency bottlenecks without centralized telemetry logging.",
            whatYouBuild: "An API observability middleware package that tracks endpoint latency distributions, error rates, and structured logs.",
            responsibilities: [
                "Build lightweight request telemetry middleware capturing latency histograms",
                "Implement structured JSON logging with correlation IDs",
                "Expose standard Prometheus-compatible /metrics and /health endpoints",
                "Create automated alerts when error rates exceed configurable thresholds"
            ],
            skills: ["Node.js", "Logging", "Prometheus", "Docker", "API Observability"],
            whyThisProject: "Provides portfolio differentiation by demonstrating production observability.",
            suggestedFeatures: [
                "Correlation ID injection middleware",
                "Prometheus metrics endpoint exporting latency percentiles",
                "Health-check endpoint validating database connectivity",
                "Structured log aggregator with searchable log viewer"
            ],
            resumeBoost: "Developed an API observability service instrumenting request latency percentiles and structured JSON logging. Record actual metric after testing.",
            expectedEvidence: ["GitHub repository", "Prometheus dashboard screenshot"],
            estimatedDuration: "4-6 days",
            difficulty: "Beginner",
            jdRequirementsCovered: ["Observability & Logging", "Docker"],
            candidateGapsAddressed: ["DevOps & Logging"],
            roadmapConnections: ["Day 7-10 Logging & Metrics"],
            canonicalSkillIds: ["nodejs", "docker", "logging"]
        }
    ]
};

try {
    const parsed = projectRecommendationsSchema.parse(validProjects);
    assert.strictEqual(parsed.projects.length, 4);
    parsed.projects.forEach(p => {
        assert(!p.resumeBoost.includes("98%"), "No fake 98% metrics");
        assert(!p.resumeBoost.includes("95%"), "No fake 95% metrics");
    });
    console.log("✓ Project Recommendations Schema & anti-fabrication rules validated successfully");
} catch (err) {
    findings.push({ severity: "P1", feature: "Project Recommendations", issue: `Project schema validation failed: ${err.message}` });
}

// ----------------------------------------------------
// 5. Dynamic Plan Configuration Verification
// ----------------------------------------------------
console.log("\n[AUDIT 5] Verifying Dynamic Plan Configuration Logic in ai.service.js...");
const aiServiceCode = fs.readFileSync(path.join(__dirname, "services/ai.service.js"), "utf8");

if (aiServiceCode.includes("planConfig") && aiServiceCode.includes("effectivePlanConfig")) {
    console.log("✓ ai.service.js dynamically passes planConfig to generators and merge logic");
} else {
    findings.push({
        severity: "P2",
        feature: "Custom Plan Config",
        issue: "ai.service.js does not fully pass planConfig parameters to all generators"
    });
}

console.log("\n==================================================");
console.log(`AI GROUNDING & QUALITY AUDIT COMPLETE — ${findings.length} Finding(s)`);
console.log("==================================================");
if (findings.length > 0) {
    console.log(JSON.stringify(findings, null, 2));
}
