const PracticeSession = require("../models/practiceSession.model");
const InterviewReport = require("../models/interviewReport.model");
const { evaluateTechnicalAnswer, evaluateBehavioralAnswer } = require("./ai/generators/answerEvaluator");

function getRequiredCount(mode) {
    switch (mode) {
        case "technical": return 20;
        case "mcq": return 15;
        case "behavioral": return 10;
        case "mixed": return 45;
        default: return 0;
    }
}

function countAttemptedQuestions(session) {
    const attemptedSet = new Set();
    if (Array.isArray(session.answers)) {
        session.answers.forEach(a => {
            const hasAttempt = a.isSkipped === true ||
                (typeof a.confidence === "string" && a.confidence.length > 0) ||
                (typeof a.selectedOption === "string" && a.selectedOption.length > 0) ||
                (typeof a.userAnswer === "string" && a.userAnswer.trim().length > 0) ||
                (typeof a.score === "number");
            if (hasAttempt) {
                attemptedSet.add(`${a.questionType}-${a.questionIndex}`);
            }
        });
    }
    return attemptedSet.size;
}

function calculateCurrentScore(session) {
    if (!session.answers || session.answers.length === 0) return 0;
    const scoredAnswers = session.answers.filter(a => typeof a.score === "number");
    if (scoredAnswers.length === 0) return 0;
    const sum = scoredAnswers.reduce((acc, a) => acc + a.score, 0);
    return Math.round(sum / scoredAnswers.length);
}

/**
 * Start or resume a practice session
 */
async function startOrGetPracticeSession({ userId, interviewReportId, mode }) {
    if (!userId || !interviewReportId || !mode) {
        throw new Error("Missing required parameters: userId, interviewReportId, mode");
    }

    const report = await InterviewReport.findOne({ _id: interviewReportId, user: userId });
    if (!report) {
        throw new Error("Interview report not found or unauthorized");
    }

    // Check for existing in-progress session
    let session = await PracticeSession.findOne({
        user: userId,
        interviewReport: interviewReportId,
        mode: mode,
        status: "IN_PROGRESS"
    });

    if (!session) {
        session = await PracticeSession.create({
            user: userId,
            interviewReport: interviewReportId,
            selectedTrackTitle: report.selectedTrackTitle || report.title || "Interview Track",
            mode: mode,
            status: "IN_PROGRESS"
        });
    }

    const attemptedCount = countAttemptedQuestions(session);
    const requiredCount = getRequiredCount(session.mode);

    return {
        session,
        report,
        attemptedCount,
        requiredCount,
        remainingCount: Math.max(0, requiredCount - attemptedCount)
    };
}

/**
 * Get session by ID and verify ownership
 */
async function getPracticeSessionById({ userId, sessionId }) {
    const session = await PracticeSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        throw new Error("Practice session not found or unauthorized");
    }

    const report = await InterviewReport.findOne({ _id: session.interviewReport, user: userId });
    if (!report) {
        throw new Error("Associated interview report not found");
    }

    const attemptedCount = countAttemptedQuestions(session);
    const requiredCount = getRequiredCount(session.mode);

    return {
        session,
        report,
        attemptedCount,
        requiredCount,
        remainingCount: Math.max(0, requiredCount - attemptedCount),
        isCompleted: session.status === "COMPLETED"
    };
}

/**
 * Update session progress
 */
async function updateProgress({ userId, sessionId, progressData, timeSpentDelta = 0 }) {
    const session = await PracticeSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        throw new Error("Practice session not found or unauthorized");
    }

    if (progressData.technicalProgress) {
        session.technicalProgress = { ...session.technicalProgress.toObject(), ...progressData.technicalProgress };
    }
    if (progressData.mcqProgress) {
        session.mcqProgress = { ...session.mcqProgress.toObject(), ...progressData.mcqProgress };
    }
    if (progressData.behavioralProgress) {
        session.behavioralProgress = { ...session.behavioralProgress.toObject(), ...progressData.behavioralProgress };
    }

    if (timeSpentDelta > 0) {
        session.timeSpentSeconds = (session.timeSpentSeconds || 0) + timeSpentDelta;
    }

    await session.save();
    return session;
}

/**
 * Submit or update a single question answer
 */
async function submitAnswer({ userId, sessionId, answerData }) {
    const session = await PracticeSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        throw new Error("Practice session not found or unauthorized");
    }

    const {
        questionIndex,
        questionType,
        questionText,
        category,
        difficulty,
        userAnswer,
        selectedOption,
        isCorrect,
        isSkipped,
        confidence,
        score,
        feedback,
        timeSpentSeconds
    } = answerData;

    let computedScore = undefined;
    if (typeof score === "number") {
        computedScore = score;
    } else if (confidence === "KNOWN") {
        computedScore = 100;
    } else if (confidence === "PARTIAL") {
        computedScore = 60;
    } else if (confidence === "UNKNOWN") {
        computedScore = 20;
    } else if (typeof isCorrect === "boolean") {
        computedScore = isCorrect ? 100 : 0;
    } else if (isSkipped) {
        computedScore = 0;
    }

    // Find if answer exists for this index + type
    const existingIndex = session.answers.findIndex(
        a => a.questionIndex === questionIndex && a.questionType === questionType
    );

    const newAnswer = {
        questionIndex,
        questionType,
        questionText: questionText || "",
        category: category || "General",
        difficulty: difficulty || "Medium",
        userAnswer: userAnswer || "",
        selectedOption: selectedOption || "",
        isCorrect: typeof isCorrect === "boolean" ? isCorrect : undefined,
        isSkipped: isSkipped === true,
        confidence: confidence || undefined,
        score: computedScore,
        feedback: feedback || undefined,
        timeSpentSeconds: timeSpentSeconds || 0,
        submittedAt: new Date()
    };

    if (existingIndex >= 0) {
        session.answers[existingIndex] = newAnswer;
    } else {
        session.answers.push(newAnswer);
    }

    // Update mode-specific counts
    const techAns = session.answers.filter(a => a.questionType === "technical");
    session.technicalProgress.answered = techAns.filter(a => !a.isSkipped).length;
    session.technicalProgress.skipped = techAns.filter(a => a.isSkipped).length;

    const mcqAns = session.answers.filter(a => a.questionType === "mcq");
    session.mcqProgress.attempted = mcqAns.length;
    session.mcqProgress.correct = mcqAns.filter(a => a.isCorrect === true).length;
    session.mcqProgress.incorrect = mcqAns.filter(a => a.isCorrect === false && !a.isSkipped).length;

    const behAns = session.answers.filter(a => a.questionType === "behavioral");
    session.behavioralProgress.answered = behAns.filter(a => !a.isSkipped).length;
    session.behavioralProgress.skipped = behAns.filter(a => a.isSkipped).length;

    if (questionType === "technical") {
        session.technicalProgress.currentIndex = Math.max(session.technicalProgress.currentIndex, questionIndex + 1);
    } else if (questionType === "mcq") {
        session.mcqProgress.currentIndex = Math.max(session.mcqProgress.currentIndex, questionIndex + 1);
    } else if (questionType === "behavioral") {
        session.behavioralProgress.currentIndex = Math.max(session.behavioralProgress.currentIndex, questionIndex + 1);
    }

    if (timeSpentSeconds > 0) {
        session.timeSpentSeconds = (session.timeSpentSeconds || 0) + timeSpentSeconds;
    }

    // Update in-progress score
    session.overallScore = calculateCurrentScore(session);

    await session.save();
    return session;
}

/**
 * Evaluate user's text answer using AI (only called on explicit request)
 */
async function evaluateUserAnswer({ questionType, questionData, userAnswer }) {
    if (!userAnswer || !userAnswer.trim()) {
        throw new Error("Answer content is required for evaluation");
    }

    if (questionType === "technical") {
        return await evaluateTechnicalAnswer({
            question: questionData.question,
            expectedAnswer: questionData.interviewAnswer || questionData.answer || questionData.oneLineAnswer,
            simpleExplanation: questionData.simpleExplanation,
            easyExample: questionData.easyExample,
            realWorldExample: questionData.realWorldExample,
            userAnswer: userAnswer.trim()
        });
    } else if (questionType === "behavioral") {
        return await evaluateBehavioralAnswer({
            question: questionData.question,
            intention: questionData.intention,
            howToAnswer: questionData.howToAnswer,
            situation: questionData.situation,
            task: questionData.task,
            action: questionData.action,
            result: questionData.result,
            userAnswer: userAnswer.trim()
        });
    } else {
        throw new Error("Unsupported question type for AI evaluation");
    }
}

/**
 * Complete session and calculate analytics + weak topics
 * ENFORCES: All required questions in mode must be attempted.
 */
async function completeSession({ userId, sessionId }) {
    const session = await PracticeSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        throw new Error("Practice session not found or unauthorized");
    }

    const requiredCount = getRequiredCount(session.mode);
    const attemptedCount = countAttemptedQuestions(session);

    if (attemptedCount < requiredCount) {
        const error = new Error(`Cannot complete practice session early. ${attemptedCount} of ${requiredCount} questions attempted.`);
        error.statusCode = 400;
        error.attemptedCount = attemptedCount;
        error.requiredCount = requiredCount;
        error.remainingCount = requiredCount - attemptedCount;
        throw error;
    }

    const report = await InterviewReport.findOne({ _id: session.interviewReport, user: userId });
    const roadmap = report?.preparationPlan || [];

    // Calculate topic performances
    const topicStats = {};
    session.answers.forEach(ans => {
        const topic = ans.category || "General";
        if (!topicStats[topic]) {
            topicStats[topic] = { attempted: 0, totalScore: 0, count: 0 };
        }
        topicStats[topic].attempted++;
        
        let itemScore = typeof ans.score === "number" ? ans.score : 0;
        topicStats[topic].totalScore += itemScore;
        topicStats[topic].count++;
    });

    const topicPerformance = Object.keys(topicStats).map(topic => {
        const t = topicStats[topic];
        const avg = t.count > 0 ? Math.round(t.totalScore / t.count) : 0;
        return {
            topic,
            attempted: t.attempted,
            correctOrKnown: Math.round((t.totalScore / 100)),
            score: avg
        };
    });

    // Detect weak topics (score < 70)
    const weakTopicsList = topicPerformance
        .filter(t => t.score < 70)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map(w => {
            // Find relevant roadmap day
            let matchedDay = null;
            const lowerTopic = w.topic.toLowerCase();
            for (const day of roadmap) {
                const dayText = `${day.focus} ${day.tasks?.join(' ')}`.toLowerCase();
                if (dayText.includes(lowerTopic) || lowerTopic.split(' ').some(wrd => wrd.length > 3 && dayText.includes(wrd))) {
                    matchedDay = day;
                    break;
                }
            }

            return {
                topic: w.topic,
                score: w.score,
                recommendedRoadmapDay: matchedDay ? matchedDay.day : (roadmap[0]?.day || 1),
                roadmapFocus: matchedDay ? matchedDay.focus : (roadmap[0]?.focus || "Core Fundamentals")
            };
        });

    // Calculate final overall score
    const overallScore = calculateCurrentScore(session);

    session.topicPerformance = topicPerformance;
    session.weakTopics = weakTopicsList;
    session.overallScore = overallScore;
    session.status = "COMPLETED";
    session.completedAt = new Date();

    if (session.mode === "technical") session.technicalProgress.completed = true;
    if (session.mode === "mcq") session.mcqProgress.completed = true;
    if (session.mode === "behavioral") session.behavioralProgress.completed = true;
    if (session.mode === "mixed") {
        session.technicalProgress.completed = true;
        session.mcqProgress.completed = true;
        session.behavioralProgress.completed = true;
    }

    await session.save();

    return {
        session,
        report,
        attemptedCount,
        requiredCount
    };
}

/**
 * Get user practice statistics across all sessions
 */
async function getUserPracticeStats({ userId }) {
    const sessions = await PracticeSession.find({ user: userId }).sort({ updatedAt: -1 });

    let totalPracticed = 0;
    let technicalCount = 0;
    let mcqCount = 0;
    let behavioralCount = 0;
    let totalScoreSum = 0;
    let completedSessionsCount = 0;

    sessions.forEach(s => {
        totalPracticed += s.answers.length;
        technicalCount += s.answers.filter(a => a.questionType === "technical").length;
        mcqCount += s.answers.filter(a => a.questionType === "mcq").length;
        behavioralCount += s.answers.filter(a => a.questionType === "behavioral").length;
        if (s.status === "COMPLETED" && s.overallScore > 0) {
            totalScoreSum += s.overallScore;
            completedSessionsCount++;
        }
    });

    const averageReadiness = completedSessionsCount > 0 
        ? Math.round(totalScoreSum / completedSessionsCount) 
        : (totalPracticed > 0 ? 70 : 0);

    return {
        totalSessions: sessions.length,
        completedSessions: completedSessionsCount,
        averageReadiness,
        questionsPracticed: {
            total: totalPracticed,
            technical: technicalCount,
            mcq: mcqCount,
            behavioral: behavioralCount
        },
        recentSessions: sessions.slice(0, 5)
    };
}

module.exports = {
    startOrGetPracticeSession,
    getPracticeSessionById,
    updateProgress,
    submitAnswer,
    evaluateUserAnswer,
    completeSession,
    getUserPracticeStats,
    getRequiredCount,
    countAttemptedQuestions
};
