const interviewReportModel = require("../models/interviewReport.model");
const LearningJourney = require("../models/learningJourney.model");
const PracticeSession = require("../models/practiceSession.model");
const ProfileModel = require("../models/profile.model");
const JobApplication = require("../models/jobApplication.model");

/**
 * Compute comprehensive readiness breakdown for a specific report
 */
async function getReadinessForReport({ userId, reportId }) {
    let report = null;

    if (reportId) {
        report = await interviewReportModel.findOne({ _id: reportId, user: userId });
    } else {
        // Fallback to active journey's report, or latest report
        const activeJourney = await LearningJourney.findOne({ user: userId, status: "ACTIVE" }).populate("report");
        if (activeJourney && activeJourney.report) {
            report = activeJourney.report;
        } else {
            report = await interviewReportModel.findOne({ user: userId }).sort({ createdAt: -1 });
        }
    }

    if (!report) {
        return {
            hasReport: false,
            message: "No interview analysis report found. Analyze a job description to calculate readiness."
        };
    }

    // Parallel retrieval of user records
    const [journey, profile, completedSessions, jobApplication] = await Promise.all([
        LearningJourney.findOne({ user: userId, report: report._id }),
        ProfileModel.findOne({ user: userId }),
        PracticeSession.find({ user: userId, status: "COMPLETED" }),
        JobApplication.findOne({ user: userId, report: report._id })
    ]);

    // 1. Basic JD Info
    const targetRole = report.selectedTrackTitle || report.selectedTrack || report.title || "Target Role";
    const company = report.company || "Target Company";
    const jdMatch = typeof report.matchScore === "number" ? report.matchScore : 50;

    // 2. Skill Classification & Verified Skills Check
    const classifications = Array.isArray(report.skillClassification) ? report.skillClassification : [];
    const requiredSkillsCount = classifications.length || 10;
    const presentSkills = classifications.filter(s => s.status === "PRESENT");
    const partialSkills = classifications.filter(s => s.status === "PARTIALLY_DEMONSTRATED");
    const missingSkills = classifications.filter(s => s.status === "MISSING" || s.status === "NOT_DEMONSTRATED");

    // Gather unique verified skills for this user
    const verifiedSkillsSet = new Set();
    if (profile && Array.isArray(profile.skills)) {
        profile.skills.forEach(s => {
            if (s && s.name && (s.evidenceType === "VERIFIED" || s.source === "Resume" || s.source === "Project")) {
                verifiedSkillsSet.add(s.name.trim().toLowerCase());
            }
        });
    }
    if (profile && Array.isArray(profile.projects)) {
        profile.projects.forEach(p => {
            if (p && (p.status === "Completed" || p.status === "In Progress")) {
                (p.technologies || []).forEach(t => t && verifiedSkillsSet.add(t.trim().toLowerCase()));
                (p.skillsDemonstrated || []).forEach(t => t && verifiedSkillsSet.add(t.trim().toLowerCase()));
            }
        });
    }

    // Check which required skills are verified
    const requiredSkillsList = classifications.map(c => {
        const name = c.skill || c.requirement || "Required Skill";
        const isVerified = verifiedSkillsSet.has(name.trim().toLowerCase()) || c.status === "PRESENT";
        return {
            name,
            type: c.type || "skill",
            status: c.status,
            isVerified,
            evidence: c.evidence || "",
            reason: c.reason || ""
        };
    });

    const verifiedSkillsCount = requiredSkillsList.filter(s => s.isVerified).length;

    // 3. Roadmap Progress
    const roadmapTotalDays = journey?.roadmapDays || report.preparationPlan?.length || 15;
    const roadmapCompletedDays = journey?.completedDays?.length || 0;
    const roadmapProgress = journey?.overallProgress || (roadmapTotalDays > 0 ? Math.round((roadmapCompletedDays / roadmapTotalDays) * 100) : 0);
    const currentDay = journey?.currentDay || (roadmapCompletedDays + 1 <= roadmapTotalDays ? roadmapCompletedDays + 1 : roadmapTotalDays);
    const currentFocus = journey?.currentFocus || report.preparationPlan?.find(p => p.day === currentDay)?.focus || "Interview Review";

    // 4. Practice Scores (Technical, Behavioral, MCQ)
    let technicalScore = 0;
    let technicalCount = 0;
    let behavioralScore = 0;
    let behavioralCount = 0;
    let mcqScore = 0;
    let mcqCount = 0;
    let mockInterviewCompleted = false;

    completedSessions.forEach(sess => {
        if (sess.planType === "TECHNICAL" && typeof sess.overallScore === "number") {
            technicalScore += sess.overallScore;
            technicalCount++;
        } else if (sess.planType === "BEHAVIORAL" && typeof sess.overallScore === "number") {
            behavioralScore += sess.overallScore;
            behavioralCount++;
        } else if (sess.planType === "MCQ" && typeof sess.overallScore === "number") {
            mcqScore += sess.overallScore;
            mcqCount++;
        } else if (sess.planType === "MIXED" && typeof sess.overallScore === "number") {
            mockInterviewCompleted = true;
            technicalScore += sess.overallScore;
            technicalCount++;
        }
    });

    const avgTech = technicalCount > 0 ? Math.round(technicalScore / technicalCount) : null;
    const avgBehavioral = behavioralCount > 0 ? Math.round(behavioralScore / behavioralCount) : null;
    const avgMcq = mcqCount > 0 ? Math.round(mcqScore / mcqCount) : null;

    // 5. Projects Completed
    const recommendedProjects = Array.isArray(report.recommendedProjects) ? report.recommendedProjects : [];
    const completedProjectsCount = recommendedProjects.filter(p => p.status === "COMPLETED").length;
    const requiredProjectsTotal = Math.min(2, Math.max(1, recommendedProjects.length));

    // Also check profile projects
    const profileCompletedProjects = (profile?.projects || []).filter(p => p.status === "Completed").length;
    const actualProjectsCompleted = Math.max(completedProjectsCount, profileCompletedProjects);

    // 6. Resume Readiness
    const hasOriginalResume = Boolean(report.resume && report.resume.trim().length > 0);
    const hasTailoredResume = Boolean(report.atsAnalysis || (report.resume && report.jobDescription));
    const hasJdReadyResume = Boolean((report.atsAnalysis && report.atsAnalysis.atsScore >= 70) || (report.matchScore >= 70));
    const resumeAlignmentScore = report.atsAnalysis?.atsScore || Math.min(95, Math.max(50, jdMatch + 5));

    // 7. Overall Readiness Score & Status
    const practiceFactor = avgTech !== null ? avgTech : jdMatch;
    const jdReadiness = Math.min(100, Math.round((jdMatch * 0.4) + (roadmapProgress * 0.4) + (practiceFactor * 0.2)));

    let readyStatus = "NEEDS PREPARATION";
    let readyStatusClass = "danger"; // danger | warning | success
    let readyStatusText = "🔴 NEEDS PREPARATION";

    if (jdReadiness >= 75 && verifiedSkillsCount >= Math.round(requiredSkillsCount * 0.6)) {
        readyStatus = "READY TO APPLY";
        readyStatusClass = "success";
        readyStatusText = "🟢 READY TO APPLY";
    } else if (jdReadiness >= 50 || verifiedSkillsCount >= Math.round(requiredSkillsCount * 0.4)) {
        readyStatus = "ALMOST READY";
        readyStatusClass = "warning";
        readyStatusText = "🟡 ALMOST READY";
    }

    // 8. Grounded Evidence: Why Ready vs Why Not Ready
    const whyReady = [];
    const stillMissing = [];

    if (jdMatch >= 75) {
        whyReady.push(`High initial JD alignment score (${jdMatch}%)`);
    }
    if (presentSkills.length > 0) {
        whyReady.push(`Demonstrated evidence for ${presentSkills.slice(0, 3).map(s => s.skill || s.requirement).join(", ")}`);
    }
    if (roadmapProgress >= 70) {
        whyReady.push(`Roadmap curriculum substantially completed (${roadmapCompletedDays}/${roadmapTotalDays} days)`);
    }
    if (avgTech && avgTech >= 75) {
        whyReady.push(`Technical practice proficiency verified at ${avgTech}%`);
    }
    if (avgBehavioral && avgBehavioral >= 75) {
        whyReady.push(`STAR behavioral communication evaluated at ${avgBehavioral}%`);
    }
    if (actualProjectsCompleted > 0) {
        whyReady.push(`${actualProjectsCompleted} showcase project(s) completed with verified evidence`);
    }
    if (hasJdReadyResume) {
        whyReady.push("JD-ready resume generated and aligned with target role");
    }

    if (missingSkills.length > 0) {
        stillMissing.push(`Missing evidence for: ${missingSkills.slice(0, 3).map(s => s.skill || s.requirement).join(", ")}`);
    }
    if (partialSkills.length > 0) {
        stillMissing.push(`Deepen practical demonstration for: ${partialSkills.slice(0, 2).map(s => s.skill || s.requirement).join(", ")}`);
    }
    if (roadmapCompletedDays < roadmapTotalDays) {
        stillMissing.push(`${roadmapTotalDays - roadmapCompletedDays} roadmap day(s) remaining (Current: Day ${currentDay})`);
    }
    if (avgTech === null) {
        stillMissing.push("Technical interview practice session not yet completed");
    } else if (avgTech < 70) {
        stillMissing.push(`Technical practice score (${avgTech}%) is below 70% threshold`);
    }
    if (actualProjectsCompleted < requiredProjectsTotal) {
        stillMissing.push(`Complete at least ${requiredProjectsTotal} project(s) targeting role skill gaps`);
    }

    // 9. Next Best Action
    let nextBestAction = {
        title: "Ready to Apply!",
        description: "Your preparation meets the criteria. Download your tailored resume and track your application.",
        actionLabel: "Track Application",
        actionPath: "/applications",
        type: "APPLY"
    };

    if (missingSkills.length > 0 && verifiedSkillsCount < Math.round(requiredSkillsCount * 0.5)) {
        const topGap = missingSkills[0]?.skill || missingSkills[0]?.requirement || "Key Skill";
        nextBestAction = {
            title: `Address Skill Gap: ${topGap}`,
            description: `Build evidence or complete practice for ${topGap} to increase your candidate readiness.`,
            actionLabel: "Review Skill Hub",
            actionPath: "/profile",
            type: "SKILL"
        };
    } else if (roadmapCompletedDays < roadmapTotalDays && roadmapProgress < 80) {
        nextBestAction = {
            title: `Continue Roadmap: Day ${currentDay}`,
            description: `Focus on "${currentFocus}" to advance your preparation curriculum.`,
            actionLabel: "Continue Roadmap",
            actionPath: `/interview/${report._id}`,
            type: "ROADMAP"
        };
    } else if (avgTech === null || avgTech < 70) {
        nextBestAction = {
            title: "Complete Technical Practice Session",
            description: "Practice role-specific technical questions to validate your interview competency.",
            actionLabel: "Start Practice",
            actionPath: "/practice",
            type: "PRACTICE"
        };
    } else if (!hasJdReadyResume) {
        nextBestAction = {
            title: "Generate JD-Ready Resume",
            description: "Compile your verified skills and projects into a targeted, ATS-optimized resume.",
            actionLabel: "Generate Resume",
            actionPath: `/interview/${report._id}`,
            type: "RESUME"
        };
    }

    // 10. Application Checklist
    const checklist = [
        {
            id: "resume_parsed",
            label: "Resume uploaded & parsed",
            isComplete: hasOriginalResume,
            detail: hasOriginalResume ? "Original resume verified" : "Upload resume in planner"
        },
        {
            id: "jd_analyzed",
            label: "Target JD analyzed & requirements classified",
            isComplete: true,
            detail: `${classifications.length} requirements mapped`
        },
        {
            id: "skills_reviewed",
            label: "Required skills reviewed & verified",
            isComplete: verifiedSkillsCount >= Math.round(requiredSkillsCount * 0.6),
            detail: `${verifiedSkillsCount} / ${requiredSkillsCount} skills verified`
        },
        {
            id: "project_evidence",
            label: "Project evidence available",
            isComplete: actualProjectsCompleted >= 1,
            detail: `${actualProjectsCompleted} project(s) completed`
        },
        {
            id: "tech_practice",
            label: "Technical interview practice completed",
            isComplete: avgTech !== null && avgTech >= 70,
            detail: avgTech !== null ? `${avgTech}% average score` : "Not completed"
        },
        {
            id: "behavioral_practice",
            label: "Behavioral STAR practice completed",
            isComplete: avgBehavioral !== null && avgBehavioral >= 70,
            detail: avgBehavioral !== null ? `${avgBehavioral}% average score` : "Not completed"
        },
        {
            id: "resume_tailored",
            label: "JD-tailored resume available",
            isComplete: hasTailoredResume,
            detail: hasTailoredResume ? "Tailored version generated" : "Generate in interview planner"
        },
        {
            id: "jd_ready_resume",
            label: "JD-ready resume generated & verified",
            isComplete: hasJdReadyResume,
            detail: hasJdReadyResume ? "Ready for submission" : "Pending final check"
        }
    ];

    // 11. Return Clean Aggregated State
    return {
        hasReport: true,
        reportId: report._id,
        targetRole,
        company,
        jdMatch,
        readinessScore: jdReadiness,
        readyStatus,
        readyStatusClass,
        readyStatusText,
        metrics: {
            jdMatch: { value: jdMatch, label: "JD Match", suffix: "%", status: "OK" },
            requiredSkills: { value: `${verifiedSkillsCount} / ${requiredSkillsCount}`, label: "Required Skills", isFraction: true },
            verifiedSkills: { value: `${verifiedSkillsCount} / ${requiredSkillsCount}`, label: "Verified Skills", isFraction: true },
            roadmap: {
                value: journey ? `${roadmapCompletedDays} / ${roadmapTotalDays} days` : "Not Started",
                progressPercent: roadmapProgress,
                label: "Roadmap"
            },
            technicalPractice: {
                value: avgTech !== null ? `${avgTech}%` : "Not completed",
                score: avgTech,
                label: "Technical Practice"
            },
            behavioralPractice: {
                value: avgBehavioral !== null ? `${avgBehavioral}%` : "Not completed",
                score: avgBehavioral,
                label: "Behavioral Practice"
            },
            mcqPractice: {
                value: avgMcq !== null ? `${avgMcq}%` : "Not completed",
                score: avgMcq,
                label: "MCQ Practice"
            },
            requiredProjects: {
                value: `${actualProjectsCompleted} / ${requiredProjectsTotal}`,
                label: "Required Projects",
                isFraction: true
            },
            resumeAlignment: { value: `${resumeAlignmentScore}%`, score: resumeAlignmentScore, label: "Resume Alignment" }
        },
        breakdown: {
            whyReady,
            stillMissing
        },
        requiredSkillsList,
        projectReadiness: {
            completed: actualProjectsCompleted,
            required: requiredProjectsTotal,
            projects: recommendedProjects.map(p => ({
                num: p.num,
                name: p.name,
                status: p.status,
                skills: p.skills || [],
                resumeBoost: p.resumeBoost || ""
            }))
        },
        roadmapReadiness: {
            hasJourney: Boolean(journey),
            journeyId: journey?._id || null,
            completedDays: roadmapCompletedDays,
            totalDays: roadmapTotalDays,
            progressPercent: roadmapProgress,
            currentDay,
            currentFocus
        },
        practiceReadiness: {
            technical: avgTech,
            behavioral: avgBehavioral,
            mcq: avgMcq,
            mockCompleted: mockInterviewCompleted
        },
        resumeReadiness: {
            originalParsed: hasOriginalResume,
            tailoredGenerated: hasTailoredResume,
            jdReadyAvailable: hasJdReadyResume,
            alignmentScore: resumeAlignmentScore
        },
        nextBestAction,
        checklist,
        application: jobApplication ? {
            id: jobApplication._id,
            status: jobApplication.status,
            appliedAt: jobApplication.appliedAt,
            interviewDate: jobApplication.interviewDate,
            notes: jobApplication.notes
        } : null
    };
}

module.exports = {
    getReadinessForReport
};
