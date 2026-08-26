import api from "../../../services/apiClient";

/**
 * Get dynamic achievement milestones progression
 */
export const getAchievementProgressionApi = async (timezone = "UTC") => {
    const tz = timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC") || "UTC";
    const response = await api.get(`/api/journey/achievements/progression?timezone=${encodeURIComponent(tz)}`);
    return response.data;
};
