import api from "../../../services/apiClient";

/**
 * Get all job applications with filters
 */
export const getApplicationsApi = async ({ status = "ALL", search = "", sort = "recent" } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.append("status", status);
    if (search) params.append("search", search);
    if (sort) params.append("sort", sort);

    const response = await api.get(`/api/applications?${params.toString()}`);
    return response.data;
};

/**
 * Get single application by ID
 */
export const getApplicationByIdApi = async (id) => {
    const response = await api.get(`/api/applications/${id}`);
    return response.data;
};

/**
 * Create or track application
 */
export const createApplicationApi = async (applicationData) => {
    const response = await api.post("/api/applications", applicationData);
    return response.data;
};

/**
 * Update application status / timeline / notes
 */
export const updateApplicationApi = async (id, updateData) => {
    const response = await api.patch(`/api/applications/${id}`, updateData);
    return response.data;
};

/**
 * Delete application
 */
export const deleteApplicationApi = async (id) => {
    const response = await api.delete(`/api/applications/${id}`);
    return response.data;
};
