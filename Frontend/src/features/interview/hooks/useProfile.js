import { useState, useEffect, useCallback } from 'react';
import { getProfileApi, updateProfileApi } from '../services/profile.api';

export const useProfile = () => {
    const [profile, setProfile] = useState(null);
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [missingChecklist, setMissingChecklist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [hasChangedSinceLastPlan, setHasChangedSinceLastPlan] = useState(false);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getProfileApi();
            if (data?.profile) {
                setProfile(data.profile);
                setCompletionPercentage(data.completionPercentage || 0);
                setMissingChecklist(data.missingChecklist || []);
            }
            return data;
        } catch (err) {
            console.error("fetchProfile error:", err);
            setError(err.response?.data?.message || err.message || "Failed to load student profile");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const saveProfile = useCallback(async (customPayload = null) => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const payload = customPayload || profile;
            const data = await updateProfileApi(payload);
            setProfile(data.profile);
            setCompletionPercentage(data.completionPercentage || 0);
            setMissingChecklist(data.missingChecklist || []);
            setSuccessMessage("Profile saved successfully!");
            setHasChangedSinceLastPlan(true);
            setTimeout(() => setSuccessMessage(null), 3500);
            return data;
        } catch (err) {
            console.error("saveProfile error:", err);
            setError(err.response?.data?.message || err.message || "Failed to save profile changes");
            throw err;
        } finally {
            setSaving(false);
        }
    }, [profile]);

    // Fast state mutators
    const updatePersonalDetails = useCallback((details) => {
        setProfile(prev => ({
            ...prev,
            personalDetails: { ...(prev?.personalDetails || {}), ...details }
        }));
    }, []);

    const addSkill = useCallback(async (newSkill) => {
        if (!newSkill || !newSkill.name) return;
        const currentSkills = profile?.skills || [];
        const updatedSkills = [...currentSkills, newSkill];
        const updated = { ...profile, skills: updatedSkills };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const removeSkill = useCallback(async (index) => {
        const currentSkills = profile?.skills || [];
        const updatedSkills = currentSkills.filter((_, i) => i !== index);
        const updated = { ...profile, skills: updatedSkills };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const addProject = useCallback(async (newProject) => {
        if (!newProject || !newProject.name) return;
        const currentProjects = profile?.projects || [];
        const updatedProjects = [...currentProjects, newProject];
        const updated = { ...profile, projects: updatedProjects };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const updateProject = useCallback(async (index, modifiedProject) => {
        const currentProjects = profile?.projects || [];
        const updatedProjects = currentProjects.map((p, i) => i === index ? modifiedProject : p);
        const updated = { ...profile, projects: updatedProjects };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const removeProject = useCallback(async (index) => {
        const currentProjects = profile?.projects || [];
        const updatedProjects = currentProjects.filter((_, i) => i !== index);
        const updated = { ...profile, projects: updatedProjects };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const addExperience = useCallback(async (newExp) => {
        if (!newExp || !newExp.company) return;
        const current = profile?.experience || [];
        const updated = { ...profile, experience: [...current, newExp] };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const removeExperience = useCallback(async (index) => {
        const current = profile?.experience || [];
        const updated = { ...profile, experience: current.filter((_, i) => i !== index) };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const addEducation = useCallback(async (newEdu) => {
        if (!newEdu || !newEdu.degree) return;
        const current = profile?.education || [];
        const updated = { ...profile, education: [...current, newEdu] };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const removeEducation = useCallback(async (index) => {
        const current = profile?.education || [];
        const updated = { ...profile, education: current.filter((_, i) => i !== index) };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const addCertification = useCallback(async (newCert) => {
        if (!newCert || !newCert.name) return;
        const current = profile?.certifications || [];
        const updated = { ...profile, certifications: [...current, newCert] };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const removeCertification = useCallback(async (index) => {
        const current = profile?.certifications || [];
        const updated = { ...profile, certifications: current.filter((_, i) => i !== index) };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const addLanguage = useCallback(async (newLang) => {
        if (!newLang || !newLang.language) return;
        const current = profile?.languages || [];
        const updated = { ...profile, languages: [...current, newLang] };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const removeLanguage = useCallback(async (index) => {
        const current = profile?.languages || [];
        const updated = { ...profile, languages: current.filter((_, i) => i !== index) };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const addAchievement = useCallback(async (newAch) => {
        if (!newAch || !newAch.title) return;
        const current = profile?.achievements || [];
        const updated = { ...profile, achievements: [...current, newAch] };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const removeAchievement = useCallback(async (index) => {
        const current = profile?.achievements || [];
        const updated = { ...profile, achievements: current.filter((_, i) => i !== index) };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    const updateCareerGoals = useCallback(async (newGoals) => {
        const updated = { ...profile, careerGoals: { ...(profile?.careerGoals || {}), ...newGoals } };
        setProfile(updated);
        await saveProfile(updated);
    }, [profile, saveProfile]);

    return {
        profile,
        setProfile,
        completionPercentage,
        missingChecklist,
        loading,
        saving,
        error,
        successMessage,
        hasChangedSinceLastPlan,
        fetchProfile,
        saveProfile,
        updatePersonalDetails,
        addSkill,
        removeSkill,
        addProject,
        updateProject,
        removeProject,
        addExperience,
        removeExperience,
        addEducation,
        removeEducation,
        addCertification,
        removeCertification,
        addLanguage,
        removeLanguage,
        addAchievement,
        removeAchievement,
        updateCareerGoals
    };
};
