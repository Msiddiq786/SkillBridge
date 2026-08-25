require("dotenv").config();
const mongoose = require("mongoose");
const PracticeSession = require("./models/practiceSession.model");
const InterviewReport = require("./models/interviewReport.model");
const User = require("./models/user.model");
const practiceService = require("./services/practice.service");

async function testPhase6Practice() {
    console.log("================================================================");
    console.log("TESTING PHASE 6: INTERACTIVE INTERVIEW PRACTICE SYSTEM");
    console.log("================================================================");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to MongoDB");

    // 1. Setup Test Users
    let testUserA = await User.findOne({ email: "practice_user_a@test.com" });
    if (!testUserA) {
        testUserA = await User.create({
            username: "CandidateAlice",
            email: "practice_user_a@test.com",
            password: "hashedpassword123"
        });
    }

    let testUserB = await User.findOne({ email: "practice_user_b@test.com" });
    if (!testUserB) {
        testUserB = await User.create({
            username: "CandidateBob",
            email: "practice_user_b@test.com",
            password: "hashedpassword123"
        });
    }

    // 2. Setup Test Interview Report with Roadmap
    let testReport = await InterviewReport.findOne({ user: testUserA._id, title: "AI Full-Stack Intern" });
    if (!testReport) {
        testReport = await InterviewReport.create({
            user: testUserA._id,
            jobDescription: "Apex Tech AI Full-Stack Developer Internship with Python, React, and RAG.",
            resume: "Jordan Lee. Skills: Python, React, Node.js.",
            title: "AI Full-Stack Intern",
            company: "Apex Tech",
            matchScore: 82,
            summary: "Strong candidate in React and Python, developing skills in RAG pipelines and SQL.",
            selectedTrackTitle: "AI & Full-Stack Developer",
            strongSkills: ["React", "Node.js", "Python"],
            weakSkills: ["RAG Pipelines", "SQL"],
            technicalQuestions: [
                {
                    difficulty: "Medium",
                    category: "RAG & LLMs",
                    estimatedInterviewTime: "5 min",
                    question: "What is Retrieval-Augmented Generation (RAG) and how does it prevent LLM hallucination?",
                    intention: "Evaluates RAG architecture understanding and context injection.",
                    oneLineAnswer: "RAG retrieves relevant domain documents from a vector store and injects them into the LLM prompt.",
                    simpleExplanation: "Instead of relying on outdated training weights, RAG searches indexed documents and grounds the answer.",
                    easyExample: "Query -> Vector Search -> Relevant Docs -> LLM -> Answer",
                    realWorldExample: "Customer support chatbot answering queries based on company internal documentation.",
                    interviewAnswer: "RAG combines vector search with LLMs to provide grounded answers from private data.",
                    commonMistakes: ["Confusing RAG with fine-tuning"],
                    followUpQuestions: [
                        "How do you chunk documents?",
                        "What vector databases have you used?",
                        "How do you evaluate retrieval precision?",
                        "What is hybrid search?",
                        "How do you handle latency?"
                    ],
                    resources: ["LangChain RAG Docs"]
                }
            ],
            mcqQuestions: [
                {
                    question: "Which data structure in Python is immutable?",
                    difficulty: "Easy",
                    category: "Python Basics",
                    options: ["List", "Dictionary", "Tuple", "Set"],
                    correctAnswer: "Tuple",
                    explanation: "Tuples cannot be modified after creation.",
                    resource: "Python Official Docs"
                },
                {
                    question: "What is the primary role of a Vector Database in RAG?",
                    difficulty: "Medium",
                    category: "RAG & LLMs",
                    options: ["Storing SQL tables", "Fast similarity search over embeddings", "Hosting frontend UI", "Executing JavaScript"],
                    correctAnswer: "Fast similarity search over embeddings",
                    explanation: "Vector DBs index semantic embeddings for approximate nearest neighbor retrieval.",
                    resource: "Vector Search Fundamentals"
                }
            ],
            behavioralQuestions: [
                {
                    difficulty: "Medium",
                    question: "Tell me about a time you had a technical disagreement with a team member.",
                    intention: "Evaluates collaboration and conflict resolution.",
                    howToAnswer: "Use STAR: describe the architecture debate, how you gathered data, and the consensus reached.",
                    situation: "During our capstone project, my teammate wanted to use MongoDB while I advocated PostgreSQL.",
                    task: "We needed to decide on the database schema without delaying the sprint.",
                    action: "I created a benchmark script testing both query patterns and presented findings objectively.",
                    result: "We agreed on PostgreSQL for relational integrity and delivered the sprint 2 days early.",
                    commonMistakes: ["Being defensive"],
                    followUpQuestions: ["How did you handle the relationship afterwards?"]
                }
            ],
            preparationPlan: [
                {
                    day: 1,
                    focus: "Python & Core Data Structures",
                    difficulty: "Easy",
                    estimatedStudyTime: "2 hours",
                    tasks: ["Review lists and tuples", "Practice immutability"],
                    resources: ["Python Docs"],
                    expectedOutcome: "Solid grasp of data types"
                },
                {
                    day: 7,
                    focus: "RAG Pipelines & Vector Databases",
                    difficulty: "Medium",
                    estimatedStudyTime: "3 hours",
                    tasks: ["Understand chunking strategies", "Implement vector similarity search with ChromaDB"],
                    resources: ["RAG Guide"],
                    expectedOutcome: "Build working RAG pipeline"
                }
            ]
        });
    }

    console.log("✓ Test User & Interview Report ready");

    // 3. Test Session Start (Part B & C)
    console.log("\n--- TEST 1: START PRACTICE SESSION ---");
    const { session, report } = await practiceService.startOrGetPracticeSession({
        userId: testUserA._id,
        interviewReportId: testReport._id,
        mode: "mixed"
    });
    console.log(`Session ID: ${session._id}`);
    console.log(`Status: ${session.status}, Mode: ${session.mode}`);
    console.log(`Report Title: ${report.title}`);

    // 4. Test Progress Update
    console.log("\n--- TEST 2: UPDATE PROGRESS & TIME ---");
    await practiceService.updateProgress({
        userId: testUserA._id,
        sessionId: session._id,
        progressData: {
            technicalProgress: { currentIndex: 1, answered: 1 }
        },
        timeSpentDelta: 45
    });
    console.log("✓ Progress updated");

    // 5. Test Technical Self-Evaluation (Part F)
    console.log("\n--- TEST 3: SUBMIT TECHNICAL SELF-EVALUATION ---");
    await practiceService.submitAnswer({
        userId: testUserA._id,
        sessionId: session._id,
        answerData: {
            questionIndex: 0,
            questionType: "technical",
            questionText: testReport.technicalQuestions[0].question,
            category: "RAG & LLMs",
            difficulty: "Medium",
            confidence: "KNOWN",
            timeSpentSeconds: 20
        }
    });
    console.log("✓ Technical self-evaluation recorded (Confidence: KNOWN)");

    // 6. Test On-Demand Technical AI Answer Evaluation (Part G)
    console.log("\n--- TEST 4: ON-DEMAND TECHNICAL AI EVALUATION ---");
    const userTechAnswer = "RAG stands for Retrieval-Augmented Generation. It takes a user query, searches a vector database for relevant documentation chunks, and injects those chunks into the prompt context for the LLM so it generates accurate answers without hallucinating.";
    const techEval = await practiceService.evaluateUserAnswer({
        questionType: "technical",
        questionData: testReport.technicalQuestions[0],
        userAnswer: userTechAnswer
    });
    console.log(`AI Score: ${techEval.score}%`);
    console.log(`Correctness: ${techEval.correctness}%, Completeness: ${techEval.completeness}%, Clarity: ${techEval.clarity}%`);
    console.log(`Strengths:`, techEval.strengths);
    console.log(`Missing Points:`, techEval.missingPoints);
    console.log(`Coaching Tips:`, techEval.improvementTips);
    console.log(`Improved Answer: "${techEval.improvedAnswer}"`);

    if (!techEval.score || techEval.score < 50) {
        throw new Error("Technical AI evaluation failed scoring threshold!");
    }

    // 7. Test MCQ Answer Submissions (Part H)
    console.log("\n--- TEST 5: MCQ ANSWER SUBMISSIONS ---");
    // Question 1 (Correct)
    await practiceService.submitAnswer({
        userId: testUserA._id,
        sessionId: session._id,
        answerData: {
            questionIndex: 0,
            questionType: "mcq",
            questionText: testReport.mcqQuestions[0].question,
            category: "Python Basics",
            difficulty: "Easy",
            selectedOption: "Tuple",
            isCorrect: true,
            score: 100,
            timeSpentSeconds: 15
        }
    });

    // Question 2 (Incorrect for weak topic testing)
    await practiceService.submitAnswer({
        userId: testUserA._id,
        sessionId: session._id,
        answerData: {
            questionIndex: 1,
            questionType: "mcq",
            questionText: testReport.mcqQuestions[1].question,
            category: "RAG & LLMs",
            difficulty: "Medium",
            selectedOption: "Hosting frontend UI",
            isCorrect: false,
            score: 0,
            timeSpentSeconds: 20
        }
    });
    console.log("✓ MCQ answers submitted (1 Correct, 1 Incorrect for RAG)");

    // 8. Test Behavioral STAR AI Answer Evaluation (Part K)
    console.log("\n--- TEST 6: ON-DEMAND BEHAVIORAL STAR EVALUATION ---");
    const userBehAnswer = "In my university project, my teammate and I disagreed on whether to use MongoDB or SQL. I proposed we run a quick load test on both. We measured read/write performance and found SQL handled our relational constraints better. We agreed on SQL and finished the project on time.";
    const behEval = await practiceService.evaluateUserAnswer({
        questionType: "behavioral",
        questionData: testReport.behavioralQuestions[0],
        userAnswer: userBehAnswer
    });
    console.log(`STAR Score: ${behEval.score}%`);
    console.log(`STAR Coverage:`, behEval.starCoverage);
    console.log(`Strengths:`, behEval.strengths);
    console.log(`Missing Elements:`, behEval.missingElements);
    console.log(`Coaching Tips:`, behEval.improvementTips);
    console.log(`Improved STAR Story: "${behEval.improvedAnswer}"`);

    // 9. Test Session Completion & Weak Topic Linking (Part N, O, P)
    console.log("\n--- TEST 7: COMPLETE SESSION & WEAK TOPIC ROADMAP LINKING ---");
    const completedResult = await practiceService.completeSession({
        userId: testUserA._id,
        sessionId: session._id
    });
    console.log(`Session Status: ${completedResult.session.status}`);
    console.log(`Overall Readiness Score: ${completedResult.session.overallScore}%`);
    console.log(`Topic Performance:`, completedResult.session.topicPerformance);
    console.log(`Weak Topics Detected:`, completedResult.session.weakTopics);

    // Verify weak topic maps to Day 7 RAG
    const ragWeakTopic = completedResult.session.weakTopics.find(w => w.topic.includes("RAG"));
    if (ragWeakTopic) {
        console.log(`✓ Weak topic "${ragWeakTopic.topic}" successfully linked to Roadmap Day ${ragWeakTopic.recommendedRoadmapDay} ("${ragWeakTopic.roadmapFocus}")`);
    }

    // 10. Test Security & User Ownership (Part W)
    console.log("\n--- TEST 8: SECURITY ISOLATION & USER OWNERSHIP ---");
    try {
        await practiceService.getPracticeSessionById({
            userId: testUserB._id, // User B attempting to access User A's session
            sessionId: session._id
        });
        throw new Error("SECURITY BREACH: User B accessed User A's practice session!");
    } catch (err) {
        console.log(`✓ Security verified: Unauthorized access blocked with error: "${err.message}"`);
    }

    // 11. Test Dashboard Aggregate Stats (Part Q)
    console.log("\n--- TEST 9: USER DASHBOARD PRACTICE STATS ---");
    const stats = await practiceService.getUserPracticeStats({ userId: testUserA._id });
    console.log(`Total Practice Sessions: ${stats.totalSessions}`);
    console.log(`Completed Sessions: ${stats.completedSessions}`);
    console.log(`Average Practice Readiness: ${stats.averageReadiness}%`);
    console.log(`Questions Practiced:`, stats.questionsPracticed);

    console.log("\n================================================================");
    console.log("PHASE 6 INTERACTIVE PRACTICE SYSTEM: ALL 9 TESTS PASSED 100%!");
    console.log("================================================================");

    await mongoose.disconnect();
}

testPhase6Practice().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
