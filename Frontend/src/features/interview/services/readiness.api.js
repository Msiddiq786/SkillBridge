import api from "../../../services/apiClient";

/**
 * Fetch application readiness for a report (or latest active report)
 */
export const getReadinessApi = async (reportId = null) => {
    const url = reportId ? `/api/readiness/${reportId}` : "/api/readiness";
    const response = await api.get(url);
    return response.data;
};
