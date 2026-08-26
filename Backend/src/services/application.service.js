const JobApplication = require("../models/jobApplication.model");
const interviewReportModel = require("../models/interviewReport.model");
const LearningJourney = require("../models/learningJourney.model");
const readinessService = require("./readiness.service");
const { unlockAchievement } = require("./journey.service");

/**
 * Get all job applications for user with status counts
 */
async function getAllApplications(userId, { status, search, sort = "recent" } = {}) {
    const query = { user: userId };

    if (status && status !== "ALL") {
        query.status = status;
    }

    if (search && search.trim().length > 0) {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [{ targetRole: regex }, { company: regex }, { notes: regex }];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "upcoming_interview") {
        sortOption = { interviewDate: 1, createdAt: -1 };
    } else if (sort === "highest_match") {
        sortOption = { "readinessSnapshot.jdMatch": -1, createdAt: -1 };
    } else if (sort === "oldest") {
        sortOption = { createdAt: 1 };
    }

    const [applications, allUserApps] = await Promise.all([
        JobApplication.find(query).sort(sortOption).populate("report", "title company matchScore selectedTrackTitle"),
        JobApplication.find({ user: userId })
    ]);

    // Status Summary Counters
    const summary = {
        total: allUserApps.length,
        preparing: allUserApps.filter(a => a.status === "PREPARING" || a.status === "SAVED" || a.status === "NOT_APPLIED").length,
        ready: allUserApps.filter(a => a.status === "READY_TO_APPLY").length,
        applied: allUserApps.filter(a => a.status === "APPLIED").length,
        interview: allUserApps.filter(a => a.status === "INTERVIEW" || a.status === "INTERVIEW_SCHEDULED" || a.status === "ASSESSMENT").length,
        offer: allUserApps.filter(a => a.status === "OFFER").length,
        rejected: allUserApps.filter(a => a.status === "REJECTED" || a.status === "WITHDRAWN").length
    };

    return {
        summary,
        applications
    };
}

/**
 * Get application by ID with ownership verification
 */
async function getApplicationById(userId, applicationId) {
    const application = await JobApplication.findOne({ _id: applicationId, user: userId })
        .populate("report")
        .populate("journey");

    if (!application) {
        throw new Error("Job application not found");
    }

    return application;
}

/**
 * Create or track a new application with readiness snapshot and timeline
 */
async function createOrTrackApplication(userId, data) {
    const {
        reportId,
        journeyId,
        targetRole,
        company,
        status = "READY_TO_APPLY",
        jobUrl = "",
        appliedAt = null,
        interviewDate = null,
        recruiterName = "",
        recruiterEmail = "",
        notes = "",
        resumeVersionUsed = null
    } = data;

    let roleName = targetRole;
    let companyName = company;
    let reportDoc = null;
    let journeyDoc = null;

    if (reportId) {
        reportDoc = await interviewReportModel.findOne({ _id: reportId, user: userId });
        if (reportDoc) {
            roleName = roleName || reportDoc.selectedTrackTitle || reportDoc.selectedTrack || reportDoc.title;
            companyName = companyName || reportDoc.company || "Target Company";
        }
    }

    if (journeyId) {
        journeyDoc = await LearningJourney.findOne({ _id: journeyId, user: userId });
    }

    // Capture historical readiness snapshot
    let readinessSnapshot = null;
    if (reportDoc) {
        try {
            const readiness = await readinessService.getReadinessForReport({ userId, reportId: reportDoc._id });
            if (readiness?.hasReport) {
                readinessSnapshot = {
                    jdMatch: readiness.jdMatch || 0,
                    verifiedSkillsCount: readiness.breakdown?.whyReady?.length || 0,
                    requiredSkillsCount: readiness.requiredSkillsList?.length || 10,
                    roadmapCompletedDays: readiness.roadmapReadiness?.completedDays || 0,
                    roadmapTotalDays: readiness.roadmapReadiness?.totalDays || 15,
                    practiceScore: readiness.practiceReadiness?.technical || 0,
                    projectsCompleted: readiness.projectReadiness?.completed || 0,
                    resumeAlignmentScore: readiness.metrics?.resumeAlignment?.score || 80,
                    status: readiness.readyStatus || "READY TO APPLY",
                    capturedAt: new Date()
                };
            }
        } catch (e) {
            console.warn("Could not capture readiness snapshot:", e.message);
        }
    }

    // Initialize grounded timeline
    const timeline = [];
    if (reportDoc) {
        timeline.push({
            date: reportDoc.createdAt || new Date(),
            title: "Analyzed Job Description",
            description: `Target fit evaluated at ${reportDoc.matchScore || 0}% match.`,
            status: "ANALYZED"
        });
    }
    if (journeyDoc) {
        timeline.push({
            date: journeyDoc.createdAt || new Date(),
            title: "Started Learning Journey",
            description: `Preparation curriculum activated for ${roleName}.`,
            status: "PREPARING"
        });
    }
    timeline.push({
        date: new Date(),
        title: status === "APPLIED" ? "Applied for Position" : "Application Added to Tracker",
        description: notes || "Application tracked in StudentSkillHub.",
        status
    });

    const application = new JobApplication({
        user: userId,
        report: reportId || null,
        journey: journeyId || null,
        targetRole: roleName || "Software Engineer",
        company: companyName || "Target Company",
        status,
        jobUrl,
        appliedAt: appliedAt || (status === "APPLIED" ? new Date() : null),
        interviewDate: interviewDate || null,
        recruiterName,
        recruiterEmail,
        notes,
        timeline,
        readinessSnapshot: readinessSnapshot || {
            jdMatch: reportDoc?.matchScore || 75,
            status: "READY TO APPLY",
            capturedAt: new Date()
        },
        resumeVersionUsed: resumeVersionUsed || {
            versionNumber: 1,
            versionName: "JD-Ready Resume"
        }
    });

    await application.save();

    // Trigger first application achievement
    await unlockAchievement(userId, "first_application", {
        company: companyName,
        role: roleName
    });

    return application;
}

/**
 * Update existing application with state progression & timeline
 */
async function updateApplication(userId, applicationId, updateData) {
    const application = await JobApplication.findOne({ _id: applicationId, user: userId });
    if (!application) {
        throw new Error("Job application not found");
    }

    const prevStatus = application.status;
    const { status, jobUrl, appliedAt, interviewDate, recruiterName, recruiterEmail, notes } = updateData;

    if (status && status !== prevStatus) {
        application.status = status;
        // Append event to timeline
        application.timeline.push({
            date: new Date(),
            title: `Status Changed to ${status.replace(/_/g, " ")}`,
            description: notes ? `Notes: ${notes}` : `Status progressed from ${prevStatus} to ${status}.`,
            status
        });

        if (status === "APPLIED" && !application.appliedAt) {
            application.appliedAt = new Date();
        }

        if (status === "OFFER") {
            await unlockAchievement(userId, "offer_ready", {
                company: application.company,
                role: application.targetRole
            });
        }
    }

    if (jobUrl !== undefined) application.jobUrl = jobUrl;
    if (appliedAt !== undefined) application.appliedAt = appliedAt;
    if (interviewDate !== undefined) application.interviewDate = interviewDate;
    if (recruiterName !== undefined) application.recruiterName = recruiterName;
    if (recruiterEmail !== undefined) application.recruiterEmail = recruiterEmail;
    if (notes !== undefined) application.notes = notes;

    await application.save();
    return application;
}

/**
 * Delete application record
 */
async function deleteApplication(userId, applicationId) {
    const result = await JobApplication.deleteOne({ _id: applicationId, user: userId });
    if (result.deletedCount === 0) {
        throw new Error("Application not found or already deleted");
    }
    return { success: true };
}

module.exports = {
    getAllApplications,
    getApplicationById,
    createOrTrackApplication,
    updateApplication,
    deleteApplication
};
