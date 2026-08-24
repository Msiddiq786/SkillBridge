function mergeInterviewReport({
    resumeAnalysis,
    technical,
    mcq,
    behavioral,
    skillGap,
    roadmap,
    atsAnalysis,
    selectedTrack,
    selectedTrackTitle,
    selectedTrackDetails
}) {
    return {
        title: resumeAnalysis.title,
        company: resumeAnalysis.company,
        matchScore: resumeAnalysis.matchScore,
        summary: resumeAnalysis.summary,
        strongSkills: resumeAnalysis.strongSkills || [],
        weakSkills: resumeAnalysis.weakSkills || [],
        missingKeywords: resumeAnalysis.missingKeywords || [],
        scoreExplanation: resumeAnalysis.scoreExplanation || null,
        skillClassification: resumeAnalysis.skillClassification || [],
        nextSteps: resumeAnalysis.nextSteps || [],
        selectedTrack: selectedTrackTitle || selectedTrack || null,
        selectedTrackTitle: selectedTrackTitle || null,
        selectedTrackDetails: selectedTrackDetails || (typeof selectedTrack === 'string' && selectedTrack.length > 50 ? selectedTrack : null),
        technicalQuestions:
            technical.technicalQuestions || technical,
        mcqQuestions:
            mcq.mcqQuestions || mcq,
        behavioralQuestions:
            behavioral.behavioralQuestions || behavioral,
        skillGaps:
            skillGap.skillGaps || skillGap,
        preparationPlan:
            roadmap.preparationPlan || roadmap,
        atsAnalysis:
            atsAnalysis?.atsAnalysis || atsAnalysis || null
    };
}

module.exports = {
    mergeInterviewReport
};