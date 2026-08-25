const pdfParse = require("pdf-parse");
const { detectJobTracks, generateInterviewReport, generateAtsReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
const profileService = require("../services/profile.service");

/**
 * Detect tracks in a job description
 */
async function detectTracksController(req, res) {
    try {
        const { jobDescription } = req.body;
        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ message: "Job description is required." });
        }
        const result = await detectJobTracks({ jobDescription: jobDescription.trim() });
        return res.status(200).json(result);
    } catch (err) {
        console.error("Track Detection Error:", err);
        return res.status(500).json({ message: err.message || "Failed to detect tracks." });
    }
}

/**
 * Generate interview report
 */
async function generateInterViewReportController(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a resume PDF." });
        }

        const resumeContent = await (
            new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))
        ).getText();

        const { selfDescription, jobDescription, selectedTrack, selectedTrackTitle } = req.body;

        let planConfig = null;
        if (req.body.planConfig) {
            try {
                planConfig = typeof req.body.planConfig === 'string' ? JSON.parse(req.body.planConfig) : req.body.planConfig;
            } catch (e) {
                console.warn("[Interview Controller] Failed to parse planConfig JSON:", e.message);
            }
        }

        // Fetch candidate profile for supplemental context & update resumeData
        let candidateProfileContext = "";
        try {
            const { profile } = await profileService.getProfileByUserId(req.user.id);
            if (profile) {
                candidateProfileContext = profileService.buildProfilePersonalizationContext(profile);
                // Update profile resume status
                await profileService.updateProfileByUserId(req.user.id, {
                    resumeData: {
                        fileName: req.file.originalname || "resume.pdf",
                        uploadedAt: new Date(),
                        lastAnalyzedAt: new Date(),
                        parsedTextSnippet: resumeContent.text.slice(0, 500),
                        status: "Parsed & Analyzed"
                    }
                });
            }
        } catch (profErr) {
            console.warn("[Interview Controller] Profile context skipped:", profErr.message);
        }

        const effectiveSelfDescription = [selfDescription || "", candidateProfileContext].filter(Boolean).join("\n\n");

        const { report: interViewReportByAi, resumeAnalysis } = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription: effectiveSelfDescription,
            jobDescription,
            userId: req.user.id,
            selectedTrack: selectedTrack || null,
            selectedTrackTitle: selectedTrackTitle || null,
            planConfig
        });

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription: selfDescription || "",
            jobDescription,
            selectedTrack: selectedTrackTitle || (typeof selectedTrack === 'string' && selectedTrack.length < 80 ? selectedTrack : null) || interViewReportByAi.title,
            selectedTrackTitle: selectedTrackTitle || null,
            selectedTrackDetails: selectedTrack || "",
            atsStatus: "ATS_GENERATING",
            ...interViewReportByAi,
            planConfig: interViewReportByAi.planConfig || planConfig || undefined
        });

        // ATS analysis in background
        generateAtsReport({
            resume: resumeContent.text,
            jobDescription,
            resumeAnalysis
        }).then(async (atsResult) => {
            if (atsResult?.atsAnalysis) {
                await interviewReportModel.findByIdAndUpdate(interviewReport._id, {
                    atsStatus: "ATS_READY",
                    atsAnalysis: atsResult.atsAnalysis
                });
                console.log(`[ATS Background] Completed for report ${interviewReport._id}`);
            } else {
                await interviewReportModel.findByIdAndUpdate(interviewReport._id, {
                    atsStatus: "ATS_FAILED"
                });
            }
        }).catch(async (err) => {
            console.error("[ATS Background] Failed:", err.message);
            await interviewReportModel.findByIdAndUpdate(interviewReport._id, {
                atsStatus: "ATS_FAILED"
            });
        });

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (err) {
        console.error("Interview Report Error:", err);
        return res.status(500).json({ message: err.message || "Failed to generate interview report." });
    }
}

/**
 * Get interview report by ID
 */
async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params;
    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
    if (!interviewReport) {
        return res.status(404).json({ message: "Interview report not found." });
    }
    res.status(200).json({ message: "Interview report fetched successfully.", interviewReport });
}

/**
 * Retry ATS analysis on-demand
 */
async function retryAtsAnalysisController(req, res) {
    try {
        const { interviewId } = req.params;
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id });
        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." });
        }

        await interviewReportModel.findByIdAndUpdate(interviewId, { atsStatus: "ATS_GENERATING" });

        const atsResult = await generateAtsReport({
            resume: interviewReport.resume,
            jobDescription: interviewReport.jobDescription,
            resumeAnalysis: {
                title: interviewReport.title,
                summary: interviewReport.summary,
                skillClassification: interviewReport.skillClassification
            }
        });

        if (atsResult?.atsAnalysis) {
            const updated = await interviewReportModel.findByIdAndUpdate(
                interviewId,
                { atsStatus: "ATS_READY", atsAnalysis: atsResult.atsAnalysis },
                { returnDocument: 'after' }
            );
            return res.status(200).json({
                message: "ATS analysis completed successfully.",
                atsStatus: "ATS_READY",
                atsAnalysis: updated.atsAnalysis
            });
        } else {
            await interviewReportModel.findByIdAndUpdate(interviewId, { atsStatus: "ATS_FAILED" });
            return res.status(500).json({ message: "ATS analysis failed.", atsStatus: "ATS_FAILED" });
        }
    } catch (err) {
        console.error("Retry ATS Error:", err);
        await interviewReportModel.findByIdAndUpdate(req.params.interviewId, { atsStatus: "ATS_FAILED" });
        return res.status(500).json({ message: err.message || "Failed to retry ATS analysis.", atsStatus: "ATS_FAILED" });
    }
}

/**
 * Get all reports for user
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -mcqQuestions -skillGaps -preparationPlan");
    res.status(200).json({ message: "Interview reports fetched successfully.", interviewReports });
}

/**
 * Generate resume PDF
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params;
    const interviewReport = await interviewReportModel.findOne({
        _id: interviewReportId,
        user: req.user.id
    });
    if (!interviewReport) {
        return res.status(404).json({ message: "Interview report not found." });
    }
    const { resume, jobDescription, selfDescription } = interviewReport;
    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription });
    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    });
    res.send(pdfBuffer);
}

module.exports = {
    detectTracksController,
    generateInterViewReportController,
    getInterviewReportByIdController,
    retryAtsAnalysisController,
    getAllInterviewReportsController,
    generateResumePdfController
};