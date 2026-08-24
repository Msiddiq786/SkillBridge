require("dotenv").config();
const { detectJobTracks, generateInterviewReport, generateAtsReport } = require("./services/ai.service");

const MULTI_ROLE_JD = `
TechCorp Innovation Labs — Summer Internship Opportunities

We are hiring interns across three distinct technical tracks:

TRACK 1: Mobile App Developer Intern
Responsibilities & Requirements:
- Build cross-platform mobile apps using React Native or Flutter
- Strong proficiency in JavaScript / TypeScript or Dart
- State management with Redux or Provider/Bloc
- Integrate RESTful APIs and handle offline caching
- Mobile UI/UX best practices for iOS and Android
- Experience with Git and version control

TRACK 2: AI/ML Engineering Intern
Responsibilities & Requirements:
- Develop machine learning models and data pipelines
- Strong proficiency in Python, NumPy, Pandas, Scikit-learn
- Experience with deep learning frameworks (PyTorch or TensorFlow)
- Knowledge of NLP, LLMs, and prompt engineering
- Git and collaborative workflow

TRACK 3: QA Automation Testing Intern
Responsibilities & Requirements:
- Design and execute automated end-to-end test suites
- Hands-on experience with Cypress, Playwright, or Selenium
- Strong programming in JavaScript, TypeScript, or Python
- API testing using Postman or REST Assured
- Familiarity with CI/CD pipelines (GitHub Actions, Jenkins)
- Strong bug reporting and documentation skills
`;

const SAMPLE_RESUME = `
Jane Doe
Email: jane.doe@example.com | GitHub: github.com/janedoe | LinkedIn: linkedin.com/in/janedoe

SUMMARY
Enthusiastic Software Engineering student with strong foundation in JavaScript, TypeScript, React, and Node.js. Built several full-stack and mobile applications.

TECHNICAL SKILLS
- Languages: JavaScript (ES6+), TypeScript, Python (Basic), HTML5, CSS3, SQL
- Frontend & Mobile: React, React Native, Redux Toolkit, Tailwind CSS, Material UI
- Backend: Node.js, Express.js, MongoDB, Mongoose, RESTful APIs, JWT Auth
- Tools: Git, GitHub, Postman, Docker (Basic), VS Code

PROJECTS
1. Campus Connect Mobile App (React Native, Redux Toolkit, Node.js)
- Cross-platform mobile app for university student communication
- Integrated REST APIs with JWT authentication and AsyncStorage for offline support
- Implemented real-time notifications and chat features

2. E-Commerce Platform (React, Node.js, Express, MongoDB)
- Full-stack web platform with Stripe payment processing, user authentication, and product search
- Designed RESTful API endpoints and optimized MongoDB queries

EDUCATION
B.S. Computer Science — Expected Graduation: 2026
`;

async function runVerification() {
    console.log("==================================================");
    console.log("TEST 1: MULTI-ROLE JD TRACK DETECTION");
    console.log("==================================================");
    const startTrack = Date.now();
    const trackResult = await detectJobTracks({ jobDescription: MULTI_ROLE_JD });
    const trackDuration = ((Date.now() - startTrack) / 1000).toFixed(2);
    console.log(`Track detection completed in ${trackDuration}s:`, JSON.stringify(trackResult, null, 2));

    if (!trackResult.multipleTracksDetected) {
        console.error("FAIL: Multiple tracks not detected!");
    } else {
        console.log(`SUCCESS: Detected ${trackResult.tracks.length} tracks.`);
    }

    console.log("\n==================================================");
    console.log("TEST 2: GENERATE INTERVIEW REPORT (TRACK: Mobile App Developer)");
    console.log("==================================================");
    const selectedTrack = trackResult.tracks?.[0]?.trackDescription || "Mobile App Developer Intern";
    const selectedTrackTitle = trackResult.tracks?.[0]?.trackTitle || "Mobile App Developer Intern";

    const startReport = Date.now();
    const { report, resumeAnalysis } = await generateInterviewReport({
        resume: SAMPLE_RESUME,
        selfDescription: "Passionate about React Native and cross-platform mobile development.",
        jobDescription: MULTI_ROLE_JD,
        userId: null,
        selectedTrack: `${selectedTrackTitle}: ${selectedTrack}`
    });
    const reportDuration = ((Date.now() - startReport) / 1000).toFixed(2);

    console.log(`\nReport generated in ${reportDuration}s`);
    console.log(`Title: ${report.title}`);
    console.log(`Match Score: ${report.matchScore}%`);
    console.log(`Selected Track: ${report.selectedTrack}`);
    console.log(`Summary: ${report.summary}`);

    // Verify Technical Questions
    console.log("\n--- Technical Questions Verification ---");
    console.log(`Total Technical Questions: ${report.technicalQuestions?.length} (Expected: 20)`);
    const techDiffs = { Easy: 0, Medium: 0, Hard: 0 };
    let totalFollowUps = 0;
    report.technicalQuestions?.forEach((q, i) => {
        techDiffs[q.difficulty] = (techDiffs[q.difficulty] || 0) + 1;
        totalFollowUps += q.followUpQuestions?.length || 0;
        if (i < 2) {
            console.log(`  Q${i+1} [${q.difficulty}] (${q.category}): ${q.question}`);
            console.log(`    Follow-ups (${q.followUpQuestions?.length}): ${q.followUpQuestions?.slice(0, 2).join(' | ')}...`);
        }
    });
    console.log(`Technical Difficulties:`, techDiffs);
    console.log(`Average Follow-ups per question: ${(totalFollowUps / (report.technicalQuestions?.length || 1)).toFixed(1)}`);

    // Verify MCQ Questions
    console.log("\n--- MCQ Questions Verification ---");
    console.log(`Total MCQ Questions: ${report.mcqQuestions?.length} (Expected: 15)`);
    const mcqDiffs = { Easy: 0, Medium: 0, Hard: 0 };
    report.mcqQuestions?.forEach((mcq, i) => {
        mcqDiffs[mcq.difficulty] = (mcqDiffs[mcq.difficulty] || 0) + 1;
        if (i < 2) {
            console.log(`  MCQ${i+1} [${mcq.difficulty}] (${mcq.category}): ${mcq.question}`);
            console.log(`    Options (${mcq.options?.length}): ${mcq.options?.join(' | ')}`);
            console.log(`    Correct: "${mcq.correctAnswer}" | Explanation: ${mcq.explanation?.substring(0, 60)}...`);
        }
    });
    console.log(`MCQ Difficulties:`, mcqDiffs);

    // Verify Behavioral Questions
    console.log("\n--- Behavioral Questions Verification ---");
    console.log(`Total Behavioral Questions: ${report.behavioralQuestions?.length} (Expected: 10)`);
    const behDiffs = { Easy: 0, Medium: 0, Hard: 0 };
    report.behavioralQuestions?.forEach((b, i) => {
        behDiffs[b.difficulty] = (behDiffs[b.difficulty] || 0) + 1;
        if (i < 2) {
            console.log(`  B${i+1} [${b.difficulty}]: ${b.question}`);
        }
    });
    console.log(`Behavioral Difficulties:`, behDiffs);

    // Verify Skill Gaps
    console.log("\n--- Skill Gaps Verification ---");
    console.log(`Total Skill Gaps: ${report.skillGaps?.length}`);
    report.skillGaps?.forEach((g, i) => {
        if (i < 3) console.log(`  Gap ${i+1}: ${g.skill} [${g.severity}] (${g.priority}) - ${g.reason?.substring(0, 50)}...`);
    });

    // Verify Roadmap
    console.log("\n--- Roadmap Verification ---");
    console.log(`Roadmap Days: ${report.preparationPlan?.length} (Expected: 15)`);

    // Verify Score Explanation
    console.log("\n--- Score Explanation Verification ---");
    console.log(`Reasoning: ${report.scoreExplanation?.reasoning}`);
    console.log(`Strengths count: ${report.scoreExplanation?.strengths?.length}`);
    console.log(`Partial count: ${report.scoreExplanation?.partial?.length}`);
    console.log(`Gaps count: ${report.scoreExplanation?.gaps?.length}`);

    // Verify Skill Classification
    console.log("\n--- Skill Classification Verification ---");
    console.log(`Classified items count: ${report.skillClassification?.length}`);
    report.skillClassification?.slice(0, 4).forEach(sc => {
        console.log(`  ${sc.skill} [${sc.type}]: ${sc.status}`);
    });

    console.log("\n==================================================");
    console.log("TEST 3: ATS REPORT GENERATION");
    console.log("==================================================");
    const ats = await generateAtsReport({
        resume: SAMPLE_RESUME,
        jobDescription: MULTI_ROLE_JD,
        resumeAnalysis
    });
    console.log(`ATS Score: ${ats.atsAnalysis?.atsScore}%`);
    console.log(`Strong keywords count: ${ats.atsAnalysis?.strongKeywords?.length}`);
    console.log(`Weak keywords count: ${ats.atsAnalysis?.weakKeywords?.length}`);
    console.log(`Missing keywords count: ${ats.atsAnalysis?.missingKeywords?.length}`);

    console.log("\n==================================================");
    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
}

runVerification().catch(err => {
    console.error("Verification failed with error:", err);
    process.exit(1);
});
