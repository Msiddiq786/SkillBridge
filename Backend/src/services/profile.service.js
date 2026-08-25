const ProfileModel = require("../models/profile.model");
const userModel = require("../models/user.model");

/**
 * Calculate Profile Completeness Score and Checklist
 */
function calculateCompletion(profile) {
    let score = 0;
    const missing = [];

    const p = profile.personalDetails || {};
    let personalScore = 0;
    if (p.fullName && p.fullName.trim()) personalScore += 5;
    if (p.targetRole && p.targetRole.trim()) personalScore += 5;
    if (p.location && p.location.trim()) personalScore += 5;
    if (p.bio && p.bio.trim()) personalScore += 5;
    score += personalScore;

    if (!p.fullName || !p.targetRole) {
        missing.push("Add full name and target role");
    }

    if (Array.isArray(profile.education) && profile.education.length > 0) {
        score += 15;
    } else {
        missing.push("Add education history");
    }

    const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0;
    if (skillsCount >= 3) {
        score += 20;
    } else if (skillsCount > 0) {
        score += 10;
        missing.push("Add at least 3 technical skills");
    } else {
        missing.push("Add your technical skills");
    }

    if (Array.isArray(profile.projects) && profile.projects.length > 0) {
        score += 15;
    } else {
        missing.push("Add at least 1 student/academic project");
    }

    if (profile.resumeData && (profile.resumeData.fileName || profile.resumeData.parsedTextSnippet)) {
        score += 15;
    } else {
        missing.push("Upload your resume");
    }

    const expCount = Array.isArray(profile.experience) ? profile.experience.length : 0;
    const certCount = Array.isArray(profile.certifications) ? profile.certifications.length : 0;
    if (expCount > 0 || certCount > 0) {
        score += 10;
    } else {
        missing.push("Add internship, experience, or certifications");
    }

    const langCount = Array.isArray(profile.languages) ? profile.languages.length : 0;
    const hasGoals = profile.careerGoals && (profile.careerGoals.targetRole || (profile.careerGoals.targetSkills && profile.careerGoals.targetSkills.length > 0));
    if (langCount > 0 || hasGoals) {
        score += 5;
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        missing
    };
}

/**
 * Get or Create Profile for a User
 */
async function getProfileByUserId(userId) {
    let profile = await ProfileModel.findOne({ user: userId });

    if (!profile) {
        const user = await userModel.findById(userId);
        profile = await ProfileModel.create({
            user: userId,
            personalDetails: {
                fullName: user?.username || "Student",
                email: user?.email || "",
                avatar: user?.avatar || "",
                targetRole: "Software Engineer / AI Intern",
                headline: "Computer Science Student & Developer",
                bio: "Passionate student learning modern software engineering and AI.",
                location: "India"
            },
            skills: [
                { name: "Python", category: "Technical", level: "Intermediate", evidenceType: "SELF_DECLARED", source: "Self-added" },
                { name: "JavaScript", category: "Web", level: "Intermediate", evidenceType: "SELF_DECLARED", source: "Self-added" },
                { name: "Git", category: "Tools", level: "Beginner", evidenceType: "SELF_DECLARED", source: "Self-added" }
            ],
            languages: [
                { language: "English", proficiency: "Fluent" }
            ],
            careerGoals: {
                targetRole: "Software Engineer / AI Intern",
                workPreference: "Hybrid",
                experienceLevel: "Internship"
            }
        });
    }

    const { score, missing } = calculateCompletion(profile);
    profile.completionPercentage = score;

    return {
        profile,
        completionPercentage: score,
        missingChecklist: missing
    };
}

/**
 * Update Profile
 */
async function updateProfileByUserId(userId, updateData) {
    let profile = await ProfileModel.findOne({ user: userId });

    if (!profile) {
        profile = new ProfileModel({ user: userId });
    }

    // Merge allowed fields safely
    if (updateData.personalDetails) {
        profile.personalDetails = {
            ...(profile.personalDetails?.toObject ? profile.personalDetails.toObject() : profile.personalDetails || {}),
            ...updateData.personalDetails
        };
    }

    if (Array.isArray(updateData.education)) profile.education = updateData.education;
    if (Array.isArray(updateData.skills)) profile.skills = updateData.skills;
    if (Array.isArray(updateData.languages)) profile.languages = updateData.languages;
    if (Array.isArray(updateData.projects)) profile.projects = updateData.projects;
    if (Array.isArray(updateData.experience)) profile.experience = updateData.experience;
    if (Array.isArray(updateData.certifications)) profile.certifications = updateData.certifications;
    if (Array.isArray(updateData.achievements)) profile.achievements = updateData.achievements;
    if (updateData.careerGoals) profile.careerGoals = { ...profile.careerGoals, ...updateData.careerGoals };
    if (updateData.resumeData) profile.resumeData = { ...profile.resumeData, ...updateData.resumeData };
    if (updateData.preferences) profile.preferences = { ...profile.preferences, ...updateData.preferences };

    const { score, missing } = calculateCompletion(profile);
    profile.completionPercentage = score;

    await profile.save();

    return {
        profile,
        completionPercentage: score,
        missingChecklist: missing
    };
}

/**
 * Build Profile Personalization Context for AI Prompts
 * Strictly adheres to evidence hierarchy:
 * 1. Uploaded Resume / Verified Evidence
 * 2. Verified Profile Evidence
 * 3. Verified Project Evidence
 * 4. Certification Evidence
 * 5. Self-Declared Data (clearly labeled as self-declared / interest)
 */
function buildProfilePersonalizationContext(profile) {
    if (!profile || profile.preferences?.useProfileForAi === false) {
        return "";
    }

    const lines = [];
    lines.push("\n══ CANDIDATE STUDENT PROFILE CONTEXT (SUPPLEMENTAL) ══");

    const p = profile.personalDetails || {};
    if (p.targetRole) lines.push(`Target Role: ${p.targetRole}`);
    if (p.headline) lines.push(`Student Headline: ${p.headline}`);
    if (p.location) lines.push(`Location: ${p.location}`);

    // Education
    if (Array.isArray(profile.education) && profile.education.length > 0) {
        const edu = profile.education.map(e => `${e.degree || 'Degree'} from ${e.university || 'University'} (${e.gradYear || 'Expected'})`).join("; ");
        lines.push(`Education: ${edu}`);
    }

    // Verified vs Self-Declared Skills
    if (Array.isArray(profile.skills) && profile.skills.length > 0) {
        const verified = profile.skills.filter(s => s.evidenceType === "VERIFIED").map(s => `${s.name} (${s.level})`);
        const selfDeclared = profile.skills.filter(s => s.evidenceType !== "VERIFIED").map(s => `${s.name} (${s.level || 'Self-added'})`);

        if (verified.length > 0) {
            lines.push(`Verified Skills: ${verified.join(", ")}`);
        }
        if (selfDeclared.length > 0) {
            lines.push(`Self-Declared / Learning Skills: ${selfDeclared.join(", ")}`);
        }
    }

    // Projects (Real candidate evidence for behavioral / technical follow-ups)
    if (Array.isArray(profile.projects) && profile.projects.length > 0) {
        const projSummaries = profile.projects.map(proj => {
            const tech = Array.isArray(proj.technologies) ? proj.technologies.join(", ") : "";
            return `"${proj.name}" (${tech ? `Tech: ${tech}` : ''}${proj.keyOutcome ? ` | Outcome: ${proj.keyOutcome}` : ''})`;
        });
        lines.push(`Verified Projects: ${projSummaries.join("; ")}`);
    }

    // Experience
    if (Array.isArray(profile.experience) && profile.experience.length > 0) {
        const expSummaries = profile.experience.map(exp => `${exp.role} at ${exp.company} (${exp.type})`);
        lines.push(`Experience / Internships: ${expSummaries.join("; ")}`);
    }

    // Certifications
    if (Array.isArray(profile.certifications) && profile.certifications.length > 0) {
        const certs = profile.certifications.map(c => `${c.name} (${c.issuer})`);
        lines.push(`Certifications: ${certs.join(", ")}`);
    }

    lines.push("═════════════════════════════════════════════════════════\n");
    return lines.join("\n");
}

module.exports = {
    calculateCompletion,
    getProfileByUserId,
    updateProfileByUserId,
    buildProfilePersonalizationContext
};
