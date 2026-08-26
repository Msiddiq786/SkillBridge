import api from "../../../services/apiClient";

/**
 * Get user's local timezone (e.g. "Asia/Kolkata", "America/New_York")
 */
export const getUserTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
};

/**
 * Start a new active learning journey for a report
 */
export const startLearningJourneyApi = async ({ reportId }) => {
    const timezone = getUserTimezone();
    const response = await api.post("/api/journey/start", { reportId, timezone });
    return response.data;
};

/**
 * Get journey status for a specific report
 */
export const getJourneyStatusApi = async (reportId) => {
    const response = await api.get(`/api/journey/by-report/${reportId}`);
    return response.data;
};

/**
 * Get active learning journey, real streaks, and achievements for dashboard
 */
export const getDashboardJourneyApi = async () => {
    const timezone = getUserTimezone();
    const response = await api.get(`/api/journey/dashboard?timezone=${encodeURIComponent(timezone)}`);
    return response.data;
};

/**
 * Mark a roadmap day as complete
 */
export const completeRoadmapDayApi = async (journeyId, dayNumber, taskIndices = []) => {
    const timezone = getUserTimezone();
    const response = await api.post(`/api/journey/${journeyId}/complete-day`, {
        dayNumber,
        taskIndices,
        timezone
    });
    return response.data;
};

/**
 * Update tasks for a day
 */
export const updateRoadmapDayTasksApi = async (journeyId, dayNumber, completedTasks = []) => {
    const timezone = getUserTimezone();
    const response = await api.patch(`/api/journey/${journeyId}/tasks`, {
        dayNumber,
        completedTasks,
        timezone
    });
    return response.data;
};

/**
 * Record a general learning activity
 */
export const recordLearningActivityApi = async (payload) => {
    const timezone = getUserTimezone();
    const response = await api.post("/api/journey/activity", {
        ...payload,
        timezone
    });
    return response.data;
};

/**
 * Switch primary active journey
 */
export const switchPrimaryJourneyApi = async (journeyId) => {
    const response = await api.post(`/api/journey/${journeyId}/switch`);
    return response.data;
};

/**
 * Update job application tracking
 */
export const updateJobApplicationApi = async (payload) => {
    const response = await api.post("/api/journey/application", payload);
    return response.data;
};
