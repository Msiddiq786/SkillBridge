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
            normalizedRequirement: z.string().optional(),
            type: z.string(),
            status: z.enum(["PRESENT", "PARTIALLY_DEMONSTRATED", "NOT_DEMONSTRATED", "MISSING"]),
            evidence: z.string().optional(),
            reason: z.string().optional(),
            relatedRequirements: z.array(z.string()).optional()
        })
    )
});

/* ---------------- Technical Questions ---------------- */

const technicalQuestionSchema = z.array(
    z.object({
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
        category: z.string(),
        estimatedInterviewTime: z.string().optional(),
        question: z.string(),
        oneLineAnswer: z.string().optional(),
        simpleExplanation: z.string().optional(),
        easyExample: z.string().optional(),
        realWorldExample: z.string().optional(),
        howToSayIt: z.string().optional(),
        interviewAnswer: z.string().optional(),
        intention: z.string().optional(),
        answer: z.string().optional(),
        commonMistakes: z.array(z.string()).optional().default([]),
        followUpQuestions: z.array(z.string()).optional().default([]),
        quickMemoryTip: z.string().optional(),
        resources: z.array(z.string()).optional().default([])
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
        whatTheyAreAsking: z.string().optional(),
        howToThink: z.string().optional(),
        starBreakdown: z.object({
            situation: z.string().optional(),
            task: z.string().optional(),
            action: z.string().optional(),
            result: z.string().optional()
        }).optional(),
        simpleExample: z.string().optional(),
        realWorldExample: z.string().optional(),
        howToSayIt: z.string().optional(),
        intention: z.string().optional(),
        howToAnswer: z.string().optional(),
        situation: z.string().optional(),
        task: z.string().optional(),
        action: z.string().optional(),
        result: z.string().optional(),
        interviewAnswer: z.string().optional(),
        answer: z.string().optional(),
        commonMistakes: z.array(z.string()).optional().default([]),
        followUpQuestions: z.array(z.string()).optional().default([]),
        quickTemplate: z.string().optional()
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
        whyThisMatters: z.string().optional(),
        gapAddressed: z.string().optional(),
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

/* ---------------- Answer Evaluation ---------------- */

const technicalAnswerEvaluationSchema = z.object({
    score: z.number().min(0).max(100),
    correctness: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    missingPoints: z.array(z.string()),
    improvementTips: z.array(z.string()),
    improvedAnswer: z.string()
});

const behavioralAnswerEvaluationSchema = z.object({
    score: z.number().min(0).max(100),
    starCoverage: z.object({
        situation: z.number().min(0).max(100),
        task: z.number().min(0).max(100),
        action: z.number().min(0).max(100),
        result: z.number().min(0).max(100)
    }),
    strengths: z.array(z.string()),
    missingElements: z.array(z.string()),
    improvementTips: z.array(z.string()),
    improvedAnswer: z.string()
});

/* ---------------- Project Recommendations ---------------- */

const singleProjectSchema = z.object({
    num: z.string(),
    name: z.string(),
    icon: z.string().optional().default("🚀"),
    targetRole: z.string(),
    realWorldProblem: z.string(),
    whatYouBuild: z.string(),
    responsibilities: z.array(z.string()),
    skills: z.array(z.string()),
    whyThisProject: z.string(),
    suggestedFeatures: z.array(z.string()),
    resumeBoost: z.string(),
    expectedEvidence: z.array(z.string()).optional().default([]),
    estimatedDuration: z.string().optional().default("5-7 days"),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional().default("Intermediate"),
    jdRequirementsCovered: z.array(z.string()).optional().default([]),
    candidateGapsAddressed: z.array(z.string()).optional().default([]),
    roadmapConnections: z.array(z.string()).optional().default([]),
    canonicalSkillIds: z.array(z.string()).optional().default([])
});

const projectRecommendationsSchema = z.object({
    whyTheseProjects: z.string(),
    projects: z.array(singleProjectSchema)
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
    resumePdfSchema,
    technicalAnswerEvaluationSchema,
    behavioralAnswerEvaluationSchema,
    singleProjectSchema,
    projectRecommendationsSchema
};