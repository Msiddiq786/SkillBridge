/**
 * Merge individual AI generator outputs into a single canonical interview report.
 * Ensures strict single-source-of-truth derivation from skillClassification.
 */

function isRelatedRequirement(nameA, nameB) {
    const a = (nameA || '').toLowerCase().trim();
    const b = (nameB || '').toLowerCase().trim();
    if (a === b) return true;
    if (a.includes('rag') && b.includes('rag')) return true;
    if (a.includes('vector') && b.includes('vector')) return true;
    if (a.includes('docker') && b.includes('docker')) return true;
    if (a.includes('fastapi') && b.includes('fastapi')) return true;
    if (a.includes('prompt engineering') && b.includes('prompt engineering')) return true;
    return false;
}

function mergeInterviewReport({
    resumeAnalysis,
    technical,
    mcq,
    behavioral,
    skillGap,
    roadmap,
    atsAnalysis,
    projectRecommendations,
    selectedTrack,
    selectedTrackTitle,
    selectedTrackDetails,
    planConfig
}) {
    const rawClassification = Array.isArray(resumeAnalysis?.skillClassification)
        ? resumeAnalysis.skillClassification
        : [];

    // Normalize each classification item
    const classificationList = rawClassification.map(item => {
        const reqName = item.requirement || item.skill || "Requirement";
        let rawType = (item.type || "SKILL").toUpperCase();
        if (rawType === "EXPERIENCE") rawType = "RESPONSIBILITY";
        if (!["SKILL", "RESPONSIBILITY", "EDUCATION", "OTHER"].includes(rawType)) {
            rawType = "SKILL";
        }

        return {
            requirement: reqName,
            skill: reqName,
            normalizedRequirement: item.normalizedRequirement || reqName.toLowerCase().trim(),
            type: rawType,
            status: item.status || "MISSING",
            evidence: item.evidence || "",
            reason: item.reason || "",
            relatedRequirements: Array.isArray(item.relatedRequirements) ? item.relatedRequirements : []
        };
    });

    // ── Deterministic Grouping: Strict Separation of Skills vs Responsibilities ──
    const strongSkills = classificationList
        .filter(item => item.type === 'SKILL' && item.status === 'PRESENT')
        .map(item => item.requirement);

    const demonstratedResponsibilities = classificationList
        .filter(item => item.type === 'RESPONSIBILITY' && item.status === 'PRESENT')
        .map(item => item.requirement);

    const partialSkills = classificationList
        .filter(item => item.type === 'SKILL' && item.status === 'PARTIALLY_DEMONSTRATED')
        .map(item => item.requirement);

    const partialResponsibilities = classificationList
        .filter(item => item.type === 'RESPONSIBILITY' && item.status === 'PARTIALLY_DEMONSTRATED')
        .map(item => item.requirement);

    const notDemonstratedSkills = classificationList
        .filter(item => item.type === 'SKILL' && item.status === 'NOT_DEMONSTRATED')
        .map(item => item.requirement);

    const notDemonstratedResponsibilities = classificationList
        .filter(item => item.type === 'RESPONSIBILITY' && item.status === 'NOT_DEMONSTRATED')
        .map(item => item.requirement);

    const missingSkills = classificationList
        .filter(item => item.type === 'SKILL' && item.status === 'MISSING')
        .map(item => item.requirement);

    const missingResponsibilities = classificationList
        .filter(item => item.type === 'RESPONSIBILITY' && item.status === 'MISSING')
        .map(item => item.requirement);

    const weakSkills = [...partialSkills, ...notDemonstratedSkills, ...missingSkills];
    const missingKeywords = [...missingSkills, ...missingResponsibilities];

    // ── Canonical Gaps Deduplication & Consolidation ──
    // Consolidate sub-requirements (e.g. "Develop simple RAG pipelines" linked to "RAG")
    const allNonPresentItems = classificationList.filter(item => item.status !== 'PRESENT');
    const processedGaps = [];

    // Sort to prioritize SKILL items first so they become primary parent gap cards
    const sortedNonPresent = [...allNonPresentItems].sort((a, b) => {
        if (a.type === 'SKILL' && b.type !== 'SKILL') return -1;
        if (a.type !== 'SKILL' && b.type === 'SKILL') return 1;
        return a.requirement.length - b.requirement.length;
    });

    for (const item of sortedNonPresent) {
        const existingParent = processedGaps.find(g => isRelatedRequirement(g.skill, item.requirement));

        if (existingParent) {
            // Attach as related requirement to existing gap card
            existingParent.relatedRequirements = existingParent.relatedRequirements || [];
            if (!existingParent.relatedRequirements.includes(item.requirement) && existingParent.skill !== item.requirement) {
                existingParent.relatedRequirements.push(item.requirement);
            }
        } else {
            processedGaps.push({
                skill: item.requirement,
                type: item.type,
                status: item.status,
                severity: item.status === 'MISSING' ? 'high' : item.status === 'NOT_DEMONSTRATED' ? 'medium' : 'low',
                priority: item.status === 'MISSING' ? 'High' : item.status === 'NOT_DEMONSTRATED' ? 'Medium' : 'Low',
                reason: item.evidence || `${item.requirement} is required for this role but not fully demonstrated.`,
                improvement: `Study ${item.requirement} concepts and implement practical exercises to demonstrate competency.`,
                estimatedLearningTime: item.status === 'MISSING' ? '2-3 weeks' : '1-2 weeks',
                resources: [`Official ${item.requirement} Documentation`, `${item.requirement} Practical Guide`],
                relatedRequirements: Array.isArray(item.relatedRequirements) ? [...item.relatedRequirements] : []
            });
        }
    }

    // ── Structured Score Explanation ──
    const scoreExplanation = {
        score: resumeAnalysis.matchScore,
        counts: {
            strong: strongSkills.length + demonstratedResponsibilities.length,
            partial: partialSkills.length + partialResponsibilities.length,
            notDemonstrated: notDemonstratedSkills.length + notDemonstratedResponsibilities.length,
            missing: missingSkills.length + missingResponsibilities.length,
            skillGapsCount: partialSkills.length + notDemonstratedSkills.length + missingSkills.length,
            responsibilityGapsCount: partialResponsibilities.length + notDemonstratedResponsibilities.length + missingResponsibilities.length
        },
        strengths: strongSkills,
        demonstratedResponsibilities,
        partial: partialSkills,
        partialResponsibilities,
        notDemonstrated: notDemonstratedSkills,
        notDemonstratedResponsibilities,
        missing: missingSkills,
        missingResponsibilities,
        gaps: [...partialSkills, ...notDemonstratedSkills, ...missingSkills],
        reasoning: resumeAnalysis.scoreExplanation?.reasoning || `Score based on ${strongSkills.length} demonstrated skills, ${demonstratedResponsibilities.length} demonstrated responsibilities, and ${missingSkills.length} missing technical areas.`
    };

    // ── Deduplicated Actionable Next Steps ──
    const derivedNextSteps = [];
    const stepTopics = new Set();

    for (const gap of processedGaps) {
        const topic = gap.skill;
        if (stepTopics.has(topic.toLowerCase().trim())) continue;
        stepTopics.add(topic.toLowerCase().trim());

        if (gap.status === 'MISSING') {
            derivedNextSteps.push(`Learn ${topic} fundamentals and build a working implementation.`);
        } else if (gap.status === 'NOT_DEMONSTRATED') {
            derivedNextSteps.push(`Practice and document ${topic} workflows in a portfolio project.`);
        } else {
            derivedNextSteps.push(`Deepen practical proficiency in ${topic}.`);
        }

        if (derivedNextSteps.length >= 5) break;
    }

    return {
        title: resumeAnalysis.title,
        company: resumeAnalysis.company,
        matchScore: resumeAnalysis.matchScore,
        summary: resumeAnalysis.summary,
        strongSkills,
        demonstratedResponsibilities,
        weakSkills,
        missingKeywords,
        scoreExplanation,
        skillClassification: classificationList,
        nextSteps: derivedNextSteps.length > 0 ? derivedNextSteps : (resumeAnalysis.nextSteps || []),
        selectedTrack: selectedTrackTitle || selectedTrack || null,
        selectedTrackTitle: selectedTrackTitle || null,
        selectedTrackDetails: selectedTrackDetails || (typeof selectedTrack === 'string' && selectedTrack.length > 50 ? selectedTrack : null),
        technicalQuestions: technical?.technicalQuestions || technical || [],
        mcqQuestions: mcq?.mcqQuestions || mcq || [],
        behavioralQuestions: behavioral?.behavioralQuestions || behavioral || [],
        skillGaps: processedGaps,
        preparationPlan: roadmap?.preparationPlan || roadmap || [],
        whyTheseProjects: projectRecommendations?.whyTheseProjects || "",
        recommendedProjects: projectRecommendations?.recommendedProjects || [],
        atsAnalysis: atsAnalysis?.atsAnalysis || atsAnalysis || null,
        planConfig: planConfig || null
    };
}

module.exports = {
    mergeInterviewReport
};