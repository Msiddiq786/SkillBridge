const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { projectRecommendationsSchema } = require("../schemas");
const { buildProjectRecommendationsPrompt } = require("../prompts/project.prompt");

/**
 * Generate Role-Specific, Candidate-Aware, Real-World Project Recommendations (Exactly 4)
 */
async function generateProjectRecommendations({
    resume,
    selfDescription,
    jobDescription,
    selectedTrack,
    skillClassification,
    summary,
    targetRole,
    company
}) {
    const prompt = buildProjectRecommendationsPrompt({
        resume,
        selfDescription,
        jobDescription,
        selectedTrack,
        skillClassification,
        summary,
        targetRole,
        company
    });

    try {
        const response = await generateJson({
            model: MODELS.FAST,
            contents: prompt,
            config: {
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(projectRecommendationsSchema)
            }
        });

        const rawProjects = Array.isArray(response?.projects) ? response.projects : [];

        // Ensure exactly 4 projects with proper numbering
        const validProjects = rawProjects.slice(0, 4).map((p, idx) => {
            const numStr = String(idx + 1).padStart(2, "0");
            return {
                num: numStr,
                name: p.name || `Target Project ${numStr}`,
                icon: p.icon || (idx === 0 ? "🚀" : idx === 1 ? "📊" : idx === 2 ? "⚙️" : "🛡️"),
                targetRole: p.targetRole || targetRole || "Target Role",
                realWorldProblem: p.realWorldProblem || "Solves key operational challenges for team workflows.",
                whatYouBuild: p.whatYouBuild || "Build a working prototype demonstrating core requirements.",
                responsibilities: Array.isArray(p.responsibilities) && p.responsibilities.length > 0
                    ? p.responsibilities
                    : ["Design system architecture", "Implement core logic", "Write unit tests", "Deploy working prototype"],
                skills: Array.isArray(p.skills) && p.skills.length > 0
                    ? p.skills
                    : ["Software Engineering", "APIs", "Testing"],
                whyThisProject: p.whyThisProject || "Addresses critical target role requirements.",
                suggestedFeatures: Array.isArray(p.suggestedFeatures) && p.suggestedFeatures.length > 0
                    ? p.suggestedFeatures
                    : ["Core module implementation", "Data ingestion pipeline", "API endpoints", "Error logging"],
                resumeBoost: p.resumeBoost || "Adds verifiable hands-on project evidence for your resume.",
                expectedEvidence: Array.isArray(p.expectedEvidence) && p.expectedEvidence.length > 0
                    ? p.expectedEvidence
                    : ["GitHub repository", "README documentation", "Working demo"],
                estimatedDuration: p.estimatedDuration || "5-7 days",
                difficulty: ["Beginner", "Intermediate", "Advanced"].includes(p.difficulty) ? p.difficulty : "Intermediate",
                jdRequirementsCovered: Array.isArray(p.jdRequirementsCovered) ? p.jdRequirementsCovered : [],
                candidateGapsAddressed: Array.isArray(p.candidateGapsAddressed) ? p.candidateGapsAddressed : [],
                roadmapConnections: Array.isArray(p.roadmapConnections) ? p.roadmapConnections : [],
                canonicalSkillIds: Array.isArray(p.canonicalSkillIds) ? p.canonicalSkillIds : [],
                status: "NOT_STARTED"
            };
        });

        // Fallback default if AI returned < 4 projects
        while (validProjects.length < 4) {
            const idx = validProjects.length;
            const numStr = String(idx + 1).padStart(2, "0");
            validProjects.push({
                num: numStr,
                name: `${targetRole || 'Role'} Practice Project ${numStr}`,
                icon: "🛠️",
                targetRole: targetRole || "Target Role",
                realWorldProblem: "Addresses practical implementation requirements from the job description.",
                whatYouBuild: "An end-to-end practical solution demonstrating key target technologies.",
                responsibilities: ["Design modular architecture", "Build REST APIs", "Implement data processing", "Write automated tests"],
                skills: ["Python", "REST APIs", "Git", "Testing"],
                whyThisProject: "Provides practical portfolio evidence for key job requirements.",
                suggestedFeatures: ["Authentication and setup", "Core processing pipeline", "API endpoints", "Documentation"],
                resumeBoost: "Demonstrates hands-on engineering capabilities. Record actual test metrics after verification.",
                expectedEvidence: ["GitHub repository", "README with setup instructions", "Test reports"],
                estimatedDuration: "5-7 days",
                difficulty: "Intermediate",
                jdRequirementsCovered: [],
                candidateGapsAddressed: [],
                roadmapConnections: [],
                canonicalSkillIds: [],
                status: "NOT_STARTED"
            });
        }

        return {
            whyTheseProjects: response?.whyTheseProjects || `These 4 projects were selected to directly address key skill gaps and responsibilities for ${targetRole || 'this target role'}.`,
            recommendedProjects: validProjects
        };
    } catch (err) {
        console.error("generateProjectRecommendations error:", err);
        return {
            whyTheseProjects: `Selected projects targeting high-priority requirements for ${targetRole || 'this role'}.`,
            recommendedProjects: []
        };
    }
}

module.exports = {
    generateProjectRecommendations
};
