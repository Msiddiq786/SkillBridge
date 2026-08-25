process.env.GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || "test_key_for_offline_audit";

const assert = require("assert");

console.log("==================================================");
console.log("PHASE 21-24: PRACTICE SYSTEM, SCORING & VOICE AUDIT");
console.log("==================================================");

const { getRequiredCount, countAttemptedQuestions } = require("./services/practice.service");

// ----------------------------------------------------
// 1. Question Count Validation
// ----------------------------------------------------
console.log("\n[AUDIT 1] Auditing Question Count Resolution (Default vs Custom planConfig)...");

const mockDefaultReport = {
    technicalQuestions: new Array(20).fill({}),
    mcqQuestions: new Array(15).fill({}),
    behavioralQuestions: new Array(10).fill({})
};

const mockCustomPlanReport = {
    planConfig: {
        technicalCount: 12,
        mcqCount: 20,
        behavioralCount: 8
    },
    technicalQuestions: new Array(12).fill({}),
    mcqQuestions: new Array(20).fill({}),
    behavioralQuestions: new Array(8).fill({})
};

// Default counts
assert.strictEqual(getRequiredCount("technical", mockDefaultReport), 20);
assert.strictEqual(getRequiredCount("mcq", mockDefaultReport), 15);
assert.strictEqual(getRequiredCount("behavioral", mockDefaultReport), 10);
assert.strictEqual(getRequiredCount("mixed", mockDefaultReport), 45);
console.log("✓ Default question counts correctly resolved (20 tech, 15 mcq, 10 behavioral, 45 mixed)");

// Custom counts
assert.strictEqual(getRequiredCount("technical", mockCustomPlanReport), 12);
assert.strictEqual(getRequiredCount("mcq", mockCustomPlanReport), 20);
assert.strictEqual(getRequiredCount("behavioral", mockCustomPlanReport), 8);
assert.strictEqual(getRequiredCount("mixed", mockCustomPlanReport), 40);
console.log("✓ Custom planConfig question counts correctly resolved (12 tech, 20 mcq, 8 behavioral, 40 mixed)");

// ----------------------------------------------------
// 2. Count Attempted Questions Validation
// ----------------------------------------------------
console.log("\n[AUDIT 2] Auditing Attempted Question Counting Logic...");

const mockSession = {
    answers: [
        { questionIndex: 0, questionType: "technical", confidence: "KNOWN", score: 100 },
        { questionIndex: 1, questionType: "technical", isSkipped: true },
        { questionIndex: 2, questionType: "technical", userAnswer: "Some written answer" },
        { questionIndex: 0, questionType: "mcq", selectedOption: "Option A", isCorrect: true, score: 100 },
        { questionIndex: 1, questionType: "mcq" } // unattempted
    ]
};

const attemptedCount = countAttemptedQuestions(mockSession);
assert.strictEqual(attemptedCount, 4);
console.log("✓ countAttemptedQuestions accurately counted 4 attempted questions");

// ----------------------------------------------------
// 3. Voice Transcription Anti-Repetition Quality Check
// ----------------------------------------------------
console.log("\n[AUDIT 3] Auditing Voice Transcription Anti-Repetition Detector...");

function detectSuspiciousRepetition(text) {
    if (!text || typeof text !== 'string') return false;
    const words = text.trim().toLowerCase().split(/\s+/);
    if (words.length < 6) return false;

    const maxPhraseLen = Math.min(10, Math.floor(words.length / 3));
    for (let phraseLen = 2; phraseLen <= maxPhraseLen; phraseLen++) {
        for (let i = 0; i <= words.length - phraseLen * 3; i++) {
            const phrase1 = words.slice(i, i + phraseLen).join(' ');
            const phrase2 = words.slice(i + phraseLen, i + phraseLen * 2).join(' ');
            const phrase3 = words.slice(i + phraseLen * 2, i + phraseLen * 3).join(' ');
            if (phrase1 === phrase2 && phrase2 === phrase3 && phrase1.length > 4) {
                return true;
            }
        }
    }
    return false;
}

// Clean sentence
const cleanSpeech = "List is mutable and tuple is immutable in Python.";
assert.strictEqual(detectSuspiciousRepetition(cleanSpeech), false);
console.log("✓ Clean voice transcript passed quality check");

// Corrupted microphone loop
const corruptedSpeech = "list is mutable and Pupil is list is mutable and Pupil is list is mutable and Pupil is";
assert.strictEqual(detectSuspiciousRepetition(corruptedSpeech), true);
console.log("✓ Corrupted repetitive transcript accurately flagged by anti-repetition filter");

console.log("\n==================================================");
console.log("PRACTICE & VOICE AUDIT COMPLETE — 0 Finding(s) 🚀");
console.log("==================================================");
