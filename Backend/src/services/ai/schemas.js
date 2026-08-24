const { z } = require("zod");

/* ---------------- Track Detection ---------------- */

const trackDetectionSchema = z.object({
    multipleTracksDetected: z.boolean(),
    tracks: z.array(
        z.object({
            trackTitle: z.string(),
            trackDescription: z.string()
        })
    )
});

/* ---------------- Resume Analysis ---------------- */

const resumeAnalysisSchema = z.object({
    title: z.string(),
    company: z.string(),
    matchScore: z.number(),
    summary: z.string(),
    scoreExplanation: z.object({
        reasoning: z.string()
    }),
    skillClassification: z.array(
        z.object({
            requirement: z.string().optional(),
            skill: z.string().optional(),
            type: z.string(),
            status: z.enum(["PRESENT", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED", "MISSING"]),
            evidence: z.string().optional()
        })
    )
});

/* ---------------- Technical Questions ---------------- */

const technicalQuestionSchema = z.array(
    z.object({
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        category: z.string(),
        estimatedInterviewTime: z.string(),
        question: z.string(),
        intention: z.string(),
        oneLineAnswer: z.string(),
        simpleExplanation: z.string(),
        easyExample: z.string(),
        realWorldExample: z.string(),
        interviewAnswer: z.string(),
        answer: z.string().optional(),
        commonMistakes: z.array(z.string()),
        followUpQuestions: z.array(z.string()),
        resources: z.array(z.string())
    })
);

/* ---------------- MCQ Questions ---------------- */

const mcqQuestionSchema = z.array(
    z.object({
        question: z.string(),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        category: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string(),
        explanation: z.string(),
        resource: z.string()
    })
);

/* ---------------- Behavioral Questions ---------------- */

const behavioralQuestionSchema = z.array(
    z.object({
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        question: z.string(),
        intention: z.string(),
        howToAnswer: z.string(),
        situation: z.string(),
        task: z.string(),
        action: z.string(),
        result: z.string(),
        interviewAnswer: z.string(),
        answer: z.string().optional(),
        commonMistakes: z.array(z.string()),
        followUpQuestions: z.array(z.string())
    })
);

/* ---------------- Skill Gaps ---------------- */

const skillGapSchema = z.array(
    z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        priority: z.string(),
        reason: z.string(),
        improvement: z.string(),
        estimatedLearningTime: z.string(),
        resources: z.array(z.string())
    })
);

/* ---------------- Roadmap ---------------- */

const roadmapSchema = z.array(
    z.object({
        day: z.number(),
        focus: z.string(),
        difficulty: z.string(),
        estimatedStudyTime: z.string(),
        tasks: z.array(z.string()),
        resources: z.array(z.string()),
        expectedOutcome: z.string()
    })
);

/* ---------------- ATS Analysis ---------------- */

const atsAnalysisSchema = z.object({
    atsScore: z.number(),
    keywordMatch: z.array(z.string()),
    missingKeywords: z.array(z.string()),
    strongKeywords: z.array(z.string()),
    weakKeywords: z.array(z.string()),
    resumeStrengths: z.array(z.string()),
    resumeWeaknesses: z.array(z.string()),
    improvementSuggestions: z.array(z.string())
});

/* ---------------- Resume PDF ---------------- */

const resumePdfSchema = z.object({
    html: z.string()
});

module.exports = {
    trackDetectionSchema,
    resumeAnalysisSchema,
    technicalQuestionSchema,
    mcqQuestionSchema,
    behavioralQuestionSchema,
    skillGapSchema,
    roadmapSchema,
    atsAnalysisSchema,
    resumePdfSchema
};