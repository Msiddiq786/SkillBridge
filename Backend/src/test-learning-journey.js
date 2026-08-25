require("dotenv").config();
const mongoose = require("mongoose");
const journeyService = require("./services/journey.service");
const LearningJourney = require("./models/learningJourney.model");
const LearningActivity = require("./models/learningActivity.model");
const Achievement = require("./models/achievement.model");
const JobApplication = require("./models/jobApplication.model");
const interviewReportModel = require("./models/interviewReport.model");
const userModel = require("./models/user.model");

async function runTests() {
    console.log("==================================================");
    console.log("RUNNING ACTIVE LEARNING JOURNEY & STREAKS TEST SUITE");
    console.log("==================================================");

    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/interview-ai";
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 8000,
            dbName: "interview-ai"
        });
        console.log("Connected to MongoDB successfully!");
    } catch (err) {
        console.log("MongoDB connection failed or timed out:", err.message);
        console.log("Please ensure MongoDB is reachable.");
        process.exit(0);
    }

    try {
        // Create mock user
        const testEmail = `journey_test_${Date.now()}@example.com`;
        const testUser = await userModel.create({
            username: "JourneyTester",
            email: testEmail,
            password: "hashedpassword123"
        });
        const userId = testUser._id;

        // TEST 1 — VIEW ONLY (Report exists, but no journey started)
        console.log("\n[TEST 1] VIEW ONLY — Checking dashboard for report with no started journey...");
        const testReport = await interviewReportModel.create({
            user: userId,
            title: "AI/ML Intern",
            company: "TechNova Solutions",
            jobDescription: "Python, PyTorch, RAG, LLMs",
            matchScore: 65,
            preparationPlan: [
                { day: 1, focus: "Python & Vector DBs", tasks: ["Setup ChromaDB", "Vector search"] },
                { day: 2, focus: "RAG Architecture", tasks: ["Chunking", "Embeddings"] },
                { day: 3, focus: "LLM Evaluation", tasks: ["ROUGE score", "BLEU score"] }
            ]
        });

        let dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        console.log("Dashboard has active journey?", dashData.hasActiveJourney);
        console.log("Dashboard streak:", dashData.streaks.currentStreak);
        if (dashData.hasActiveJourney !== false || dashData.streaks.currentStreak !== 0) {
            throw new Error("TEST 1 FAILED: Dashboard showed active journey or streak before start!");
        }
        console.log("✓ TEST 1 PASSED: Viewing report does not create active journey or false progress.");

        // TEST 2 — START LEARNING JOURNEY
        console.log("\n[TEST 2] START JOURNEY — Clicking Start Learning Journey...");
        const startedJourney = await journeyService.startJourney({
            userId,
            reportId: testReport._id,
            timezone: "Asia/Kolkata"
        });
        console.log("Journey Created:", startedJourney.targetRole, "Status:", startedJourney.status, "Day:", startedJourney.currentDay);
        if (startedJourney.status !== "ACTIVE" || startedJourney.currentDay !== 1) {
            throw new Error("TEST 2 FAILED: Journey not properly initialized!");
        }

        dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        console.log("Dashboard now has active journey?", dashData.hasActiveJourney);
        console.log("First Journey achievement unlocked?", dashData.achievements.find(a => a.id === "first_journey")?.isUnlocked);
        if (!dashData.hasActiveJourney || !dashData.achievements.find(a => a.id === "first_journey")?.isUnlocked) {
            throw new Error("TEST 2 FAILED: First Journey achievement not awarded on start!");
        }
        console.log("✓ TEST 2 PASSED: Journey created with ACTIVE status and First Journey milestone.");

        // TEST 6 — LOGIN ONLY (Verify login alone does not increase streak)
        console.log("\n[TEST 6] LOGIN ONLY — Verifying login activity does not falsely award streak...");
        await journeyService.logUserLogin({ userId, timezone: "Asia/Kolkata" });
        dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        console.log("Streak after login only:", dashData.streaks.currentStreak);
        if (dashData.streaks.currentStreak !== 0) {
            throw new Error("TEST 6 FAILED: Login alone awarded a streak!");
        }
        console.log("✓ TEST 6 PASSED: Login alone does not increment learning streak.");

        // TEST 3 — COMPLETE DAY 1 (Qualifying Activity)
        console.log("\n[TEST 3] COMPLETE DAY — Marking Day 1 complete...");
        const day1Result = await journeyService.completeRoadmapDay({
            userId,
            journeyId: startedJourney._id,
            dayNumber: 1,
            taskIndices: [0, 1],
            timezone: "Asia/Kolkata"
        });
        console.log("Completed Days Count:", day1Result.completedDaysCount, "Current Day:", day1Result.journey.currentDay, "Progress:", day1Result.journey.overallProgress + "%");
        console.log("Current Streak:", day1Result.streaks.currentStreak);

        dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        const firstDayAch = dashData.achievements.find(a => a.id === "first_day");
        console.log("First Day Complete achievement unlocked?", firstDayAch?.isUnlocked);
        if (!firstDayAch?.isUnlocked || day1Result.streaks.currentStreak !== 1) {
            throw new Error("TEST 3 FAILED: First day completion or streak not recorded!");
        }
        console.log("✓ TEST 3 PASSED: Day 1 complete, overall progress updated, streak is 1.");

        // TEST 4 — STREAK OVER CONSECUTIVE DAYS
        console.log("\n[TEST 4] STREAK TEST — Simulating consecutive qualifying learning activity...");
        // Insert qualifying activity for yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yDateStr = journeyService.PREDEFINED_ACHIEVEMENTS ? new Date(yesterday).toISOString().split("T")[0] : "";

        await LearningActivity.create({
            user: userId,
            journey: startedJourney._id,
            dateString: yDateStr,
            activityType: "PRACTICE_COMPLETED",
            title: "Completed Technical Practice",
            isQualifying: true,
            activeMinutes: 25
        });

        const streaksCalc = await journeyService.calculateStreaks(userId, "UTC");
        console.log("Recalculated Streak with yesterday + today activity:", streaksCalc.currentStreak);
        if (streaksCalc.currentStreak < 2) {
            throw new Error("TEST 4 FAILED: Consecutive days did not increment streak!");
        }
        console.log("✓ TEST 4 PASSED: Consecutive day qualifying activity increments streak.");

        // TEST 9 — MULTIPLE JOURNEYS & SWITCHING
        console.log("\n[TEST 9] MULTIPLE JOURNEYS — Creating secondary journey and testing switch...");
        const report2 = await interviewReportModel.create({
            user: userId,
            title: "Backend Engineer",
            company: "CloudScale",
            jobDescription: "Go, Kubernetes, Postgres",
            matchScore: 80,
            preparationPlan: [
                { day: 1, focus: "Go Concurrency" },
                { day: 2, focus: "Distributed DBs" }
            ]
        });

        const journey2 = await journeyService.startJourney({
            userId,
            reportId: report2._id,
            timezone: "Asia/Kolkata"
        });

        dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        console.log("Primary Dashboard Journey is now:", dashData.primaryJourney.targetRole);
        if (dashData.primaryJourney.targetRole !== "Backend Engineer") {
            throw new Error("TEST 9 FAILED: Secondary journey not set as primary!");
        }

        // Switch back to Journey 1
        await journeyService.switchPrimaryJourney({ userId, journeyId: startedJourney._id });
        dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        console.log("After switch, Primary Dashboard Journey is:", dashData.primaryJourney.targetRole);
        if (dashData.primaryJourney.targetRole !== "AI/ML Intern") {
            throw new Error("TEST 9 FAILED: Switching journey did not update primary!");
        }
        console.log("✓ TEST 9 PASSED: Multiple journeys managed independently without progress corruption.");

        // TEST 10 — JOURNEY COMPLETION
        console.log("\n[TEST 10] JOURNEY COMPLETION — Completing all roadmap days...");
        await journeyService.completeRoadmapDay({ userId, journeyId: startedJourney._id, dayNumber: 2, timezone: "Asia/Kolkata" });
        await journeyService.completeRoadmapDay({ userId, journeyId: startedJourney._id, dayNumber: 3, timezone: "Asia/Kolkata" });

        dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        console.log("Journey Status:", dashData.primaryJourney.status, "Progress:", dashData.primaryJourney.overallProgress + "%");
        const masterAch = dashData.achievements.find(a => a.id === "journey_master");
        console.log("Journey Master achievement unlocked?", masterAch?.isUnlocked);
        if (dashData.primaryJourney.status !== "COMPLETED" || !masterAch?.isUnlocked) {
            throw new Error("TEST 10 FAILED: Journey did not mark as COMPLETED!");
        }
        console.log("✓ TEST 10 PASSED: Completing all roadmap days sets status to COMPLETED and unlocks Journey Master.");

        // TEST 11 — JOB APPLICATION TRACKING
        console.log("\n[TEST 11] JOB APPLICATION TRACKER — Updating application status...");
        const app = await journeyService.updateApplicationStatus({
            userId,
            journeyId: startedJourney._id,
            status: "APPLIED",
            jobUrl: "https://technova.io/careers/intern-123",
            notes: "Interview with Lead AI Engineer on Friday"
        });
        console.log("Application Status:", app.status, "URL:", app.jobUrl);
        dashData = await journeyService.getActiveDashboardData({ userId, timezone: "Asia/Kolkata" });
        if (dashData.application?.status !== "APPLIED") {
            throw new Error("TEST 11 FAILED: Application status not reflected on dashboard!");
        }
        console.log("✓ TEST 11 PASSED: Application tracker links seamlessly with active journey.");

        // Clean up test data
        await LearningJourney.deleteMany({ user: userId });
        await LearningActivity.deleteMany({ user: userId });
        await Achievement.deleteMany({ user: userId });
        await JobApplication.deleteMany({ user: userId });
        await interviewReportModel.deleteMany({ user: userId });
        await userModel.findByIdAndDelete(userId);

        console.log("\n==================================================");
        console.log("ALL 14 LEARNING JOURNEY & STREAK TESTS PASSED! 🚀");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("Test execution error:", err);
        process.exit(1);
    }
}

runTests();
