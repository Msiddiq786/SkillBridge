import api from "../../../services/apiClient";

/**
 * @description Fetch current interview generation progress (0-100%)
 */
export const getProgress = async () => {
    const response = await api.get("/api/progress");
    return response.data;
};

/**
 * @description Fetch aggregated student progress summary (analyses, journeys, skills, streaks, time)
 */
export const getProgressSummaryApi = async (timezone = "UTC") => {
    const tz = timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC") || "UTC";
    const response = await api.get(`/api/progress/summary?timezone=${encodeURIComponent(tz)}`);
    return response.data;
};
