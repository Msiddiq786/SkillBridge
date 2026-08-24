const pdfParse = require("pdf-parse");
const { detectJobTracks, generateInterviewReport, generateAtsReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

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

        const { report: interViewReportByAi, resumeAnalysis } = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription: selfDescription || "",
            jobDescription,
            userId: req.user.id,
            selectedTrack: selectedTrack || null,
            selectedTrackTitle: selectedTrackTitle || null
        });

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription: selfDescription || "",
            jobDescription,
            selectedTrack: selectedTrackTitle || (typeof selectedTrack === 'string' && selectedTrack.length < 80 ? selectedTrack : null) || interViewReportByAi.title,
            selectedTrackTitle: selectedTrackTitle || null,
            selectedTrackDetails: selectedTrack || "",
            ...interViewReportByAi
        });

        // ATS analysis in background
        generateAtsReport({
            resume: resumeContent.text,
            jobDescription,
            resumeAnalysis
        }).then(async (atsResult) => {
            if (atsResult?.atsAnalysis) {
                await interviewReportModel.findByIdAndUpdate(interviewReport._id, {
                    atsAnalysis: atsResult.atsAnalysis
                });
                console.log(`[ATS Background] Completed for report ${interviewReport._id}`);
            }
        }).catch((err) => {
            console.error("[ATS Background] Failed:", err.message);
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
    const interviewReport = await interviewReportModel.findById(interviewReportId);
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
    getAllInterviewReportsController,
    generateResumePdfController
};