import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
});

/**
 * Get dynamic achievement milestones progression
 */
export const getAchievementProgressionApi = async (timezone = "UTC") => {
    const tz = timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC") || "UTC";
    const response = await api.get(`/api/journey/achievements/progression?timezone=${encodeURIComponent(tz)}`);
    return response.data;
};
