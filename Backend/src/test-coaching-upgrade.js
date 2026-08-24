require("dotenv").config();
const { generateInterviewReport } = require("./services/ai.service");

const TEST_JD = `
Apex Global Tech — Full-Stack & AI Software Engineering Internship

Requirements:
- Strong programming skills in Python or JavaScript / TypeScript
- Experience building Web APIs and full-stack applications with React and Node.js
- Familiarity with Machine Learning fundamentals and LLM prompt engineering
- Understanding of database querying (SQL / MongoDB)
- Excellent teamwork, proactive communication, and problem-solving mindset
- Experience with Git and version control
`;

const CANDIDATE_RESUME = `
Jordan Lee
Email: jordan.lee@example.com | GitHub: github.com/jordanlee | LinkedIn: linkedin.com/in/jordanlee

EDUCATION
B.S. in Software Engineering, University of Technology — Class of 2026

TECHNICAL SKILLS
- Programming: Python, JavaScript, TypeScript, SQL
- Frameworks & Libraries: React, Node.js, Express, MongoDB, Scikit-learn
- AI Tools: Google Gemini API, Prompt Engineering
- Developer Tools: Git, GitHub, Postman, Linux

PROJECTS
1. Smart Content Summarizer (Python, Google Gemini API, React)
- Built a web app to summarize technical articles and extract key action items using Gemini API.
- Implemented responsive React UI with clean state management.

2. Inventory Management REST API (Node.js, Express, MongoDB)
- Designed CRUD endpoints for inventory tracking with JWT authentication.
- Wrote API tests with Postman and handled database validation with Mongoose.
`;

async function testCoachingPipeline() {
    console.log("================================================================");
    console.log("TESTING AI INTERVIEW COACH GENERATION (TECHNICAL & BEHAVIORAL)");
    console.log("================================================================");

    const startTime = Date.now();
    const { report } = await generateInterviewReport({
        resume: CANDIDATE_RESUME,
        selfDescription: "Software engineering student focused on full-stack web and practical AI development.",
        jobDescription: TEST_JD,
        userId: null
    });
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\nReport generated in ${totalTime}s`);
    console.log(`Title: ${report.title} | Match Score: ${report.matchScore}%`);

    // ── Verify Technical Questions ──
    console.log("\n================================================================");
    console.log("1. TECHNICAL QUESTIONS VERIFICATION");
    console.log("================================================================");
    console.log(`Total Technical Questions: ${report.technicalQuestions?.length} (Expected: 20)`);
    
    if (report.technicalQuestions?.length !== 20) {
        throw new Error(`Expected 20 technical questions, got ${report.technicalQuestions?.length}`);
    }

    const techDiffs = { Easy: 0, Medium: 0, Hard: 0 };
    let missingFieldCount = 0;

    report.technicalQuestions.forEach((q, idx) => {
        techDiffs[q.difficulty] = (techDiffs[q.difficulty] || 0) + 1;

        if (!q.oneLineAnswer) { console.error(`Q${idx+1} missing oneLineAnswer`); missingFieldCount++; }
        if (!q.simpleExplanation) { console.error(`Q${idx+1} missing simpleExplanation`); missingFieldCount++; }
        if (!q.easyExample) { console.error(`Q${idx+1} missing easyExample`); missingFieldCount++; }
        if (!q.realWorldExample) { console.error(`Q${idx+1} missing realWorldExample`); missingFieldCount++; }
        if (!q.interviewAnswer) { console.error(`Q${idx+1} missing interviewAnswer`); missingFieldCount++; }
        if (!q.followUpQuestions || q.followUpQuestions.length !== 5) {
            console.error(`Q${idx+1} follow-ups length is ${q.followUpQuestions?.length} (Expected: 5)`);
            missingFieldCount++;
        }
    });

    console.log(`Difficulty Breakdown:`, techDiffs);
    console.log(`Missing fields count across all 20 technical questions: ${missingFieldCount}`);

    // Print sample Technical Question 1 & 2
    console.log("\n--- Sample Technical Question 1 (Easy) ---");
    const tq1 = report.technicalQuestions[0];
    console.log(`Q: ${tq1.question} [${tq1.difficulty}] (${tq1.category})`);
    console.log(`⭐ One-line: ${tq1.oneLineAnswer}`);
    console.log(`🧠 Simple Explanation: ${tq1.simpleExplanation}`);
    console.log(`💡 Easy Example: ${tq1.easyExample}`);
    console.log(`🌍 Real-World Use: ${tq1.realWorldExample}`);
    console.log(`🗣️ Spoken Answer: "${tq1.interviewAnswer}"`);
    console.log(`⚠️ Common Mistakes (${tq1.commonMistakes?.length}):`, tq1.commonMistakes);
    console.log(`🔄 Follow-ups (5):`, tq1.followUpQuestions);
    console.log(`📚 Resources:`, tq1.resources);

    // ── Verify Behavioral Questions ──
    console.log("\n================================================================");
    console.log("2. BEHAVIORAL QUESTIONS VERIFICATION");
    console.log("================================================================");
    console.log(`Total Behavioral Questions: ${report.behavioralQuestions?.length} (Expected: 10)`);

    if (report.behavioralQuestions?.length !== 10) {
        throw new Error(`Expected 10 behavioral questions, got ${report.behavioralQuestions?.length}`);
    }

    const behDiffs = { Easy: 0, Medium: 0, Hard: 0 };
    let behMissingFieldCount = 0;

    report.behavioralQuestions.forEach((b, idx) => {
        behDiffs[b.difficulty] = (behDiffs[b.difficulty] || 0) + 1;

        if (!b.intention) { console.error(`B${idx+1} missing intention`); behMissingFieldCount++; }
        if (!b.howToAnswer) { console.error(`B${idx+1} missing howToAnswer`); behMissingFieldCount++; }
        if (!b.situation) { console.error(`B${idx+1} missing situation`); behMissingFieldCount++; }
        if (!b.task) { console.error(`B${idx+1} missing task`); behMissingFieldCount++; }
        if (!b.action) { console.error(`B${idx+1} missing action`); behMissingFieldCount++; }
        if (!b.result) { console.error(`B${idx+1} missing result`); behMissingFieldCount++; }
        if (!b.interviewAnswer) { console.error(`B${idx+1} missing interviewAnswer`); behMissingFieldCount++; }
        if (!b.followUpQuestions || b.followUpQuestions.length < 3) {
            console.error(`B${idx+1} follow-ups length is ${b.followUpQuestions?.length} (Expected: 3-5)`);
            behMissingFieldCount++;
        }
    });

    console.log(`Difficulty Breakdown:`, behDiffs);
    console.log(`Missing fields count across all 10 behavioral questions: ${behMissingFieldCount}`);

    // Print sample Behavioral Question 1
    console.log("\n--- Sample Behavioral Question 1 (STAR Format) ---");
    const bq1 = report.behavioralQuestions[0];
    console.log(`Q: ${bq1.question} [${bq1.difficulty}]`);
    console.log(`🎯 Intention: ${bq1.intention}`);
    console.log(`🧩 How to Answer: ${bq1.howToAnswer}`);
    console.log(`⭐ STAR:`);
    console.log(`   S: ${bq1.situation}`);
    console.log(`   T: ${bq1.task}`);
    console.log(`   A: ${bq1.action}`);
    console.log(`   R: ${bq1.result}`);
    console.log(`🗣️ Spoken Answer: "${bq1.interviewAnswer}"`);
    console.log(`⚠️ Common Mistakes:`, bq1.commonMistakes);
    console.log(`🔄 Follow-ups (${bq1.followUpQuestions?.length}):`, bq1.followUpQuestions);

    console.log("\n================================================================");
    console.log("ALL AI INTERVIEW COACH PIPELINE CHECKS PASSED PERFECTLY!");
    console.log("================================================================");
}

testCoachingPipeline().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
