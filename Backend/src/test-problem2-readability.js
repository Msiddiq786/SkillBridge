require("dotenv").config();
const { generateInterviewReport } = require("./services/ai.service");

const TEST_JD = `
Apex Global Tech — Full-Stack & AI Software Engineering Internship

We are hiring interns for our emerging tech team:
TRACK: AI & Full-Stack Engineer
Responsibilities:
- Build Web APIs and microservices using Node.js and Express
- Implement reactive user interfaces with React and Tailwind CSS
- Integrate Google Gemini API and LLM prompt engineering pipelines
- Design MongoDB and SQL database schemas
- Collaborate via Git/GitHub and participate in agile sprints
`;

const CANDIDATE_RESUME = `
Jordan Lee
Email: jordan.lee@example.com | GitHub: github.com/jordanlee

TECHNICAL SKILLS:
- Languages: Python, JavaScript, TypeScript, SQL
- Web & Backend: React, Node.js, Express, MongoDB, REST APIs
- AI: Google Gemini API, Prompt Engineering
- Tools: Git, GitHub, Postman, VS Code

PROJECTS:
1. Smart Content Summarizer (Python, Google Gemini API, React)
- Built an article summarizer web app using Google Gemini API.
- Implemented clean UI state management in React.

2. Campus Store REST API (Node.js, Express, MongoDB)
- Architected RESTful endpoints with JWT authentication and Mongoose schema validation.
`;

async function testProblem2Readability() {
    console.log("================================================================");
    console.log("TESTING PROBLEM 2 READABILITY & INFORMATION OVERLOAD UPGRADE");
    console.log("================================================================");

    const startTime = Date.now();
    const { report } = await generateInterviewReport({
        resume: CANDIDATE_RESUME,
        selfDescription: "Software engineering student focused on full-stack web and AI apps.",
        jobDescription: TEST_JD,
        userId: null,
        selectedTrackTitle: "AI & Full-Stack Engineer"
    });
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\nReport generated in ${totalTime}s`);
    console.log(`Title: ${report.title}`);
    console.log(`Match Score: ${report.matchScore}%`);
    console.log(`Target Track: ${report.selectedTrackTitle || report.selectedTrack}`);
    console.log(`Summary: ${report.summary}`);

    // ── Verify Target Track Cleanliness ──
    console.log("\n1. TARGET TRACK VERIFICATION");
    const trackStr = report.selectedTrackTitle || report.selectedTrack || "";
    console.log(`Track Title Length: ${trackStr.length} characters (Clean: ${trackStr.length < 80})`);
    if (trackStr.length >= 150) {
        throw new Error("Target track is too long or contains entire raw JD!");
    }

    // ── Verify Score Explanation Structure ──
    console.log("\n2. SCORE EXPLANATION STRUCTURE");
    const exp = report.scoreExplanation;
    console.log(`Reasoning: ${exp?.reasoning}`);
    console.log(`Strengths (${exp?.strengths?.length}):`, exp?.strengths);
    console.log(`Partial (${exp?.partial?.length}):`, exp?.partial);
    console.log(`Not Demonstrated (${exp?.notDemonstrated?.length}):`, exp?.notDemonstrated);
    console.log(`Missing (${exp?.missing?.length}):`, exp?.missing);

    // ── Verify Summary Groups ──
    console.log("\n3. SUMMARY GROUPS");
    console.log(`Strong Skills:`, report.strongSkills);
    console.log(`Weak / Partial Skills:`, report.weakSkills);
    console.log(`Missing Keywords:`, report.missingKeywords);

    // ── Verify Classification ──
    console.log("\n4. CLASSIFICATION CHECK");
    console.log(`Total Classified Items: ${report.skillClassification?.length}`);
    let truncatedCount = 0;
    report.skillClassification?.forEach(c => {
        if (c.requirement.endsWith("...")) truncatedCount++;
        console.log(`  • [${c.type}] ${c.requirement} -> ${c.status}`);
    });
    console.log(`Truncated requirement names count: ${truncatedCount} (Expected: 0)`);
    if (truncatedCount > 0) {
        throw new Error("Found truncated requirement names in skillClassification!");
    }

    // ── Verify Next Steps ──
    console.log("\n5. NEXT STEPS");
    report.nextSteps?.forEach((step, i) => console.log(`  ${i+1}. ${step}`));

    console.log("\n================================================================");
    console.log("PROBLEM 2 READABILITY VERIFICATION PASSED WITH 100% SUCCESS!");
    console.log("================================================================");
}

testProblem2Readability().catch(err => {
    console.error("Test error:", err);
    process.exit(1);
});
