import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
});

/**
 * Fetch authenticated student profile
 */
export const getProfileApi = async () => {
    const response = await api.get("/api/profile");
    return response.data;
};

/**
 * Update authenticated student profile
 */
export const updateProfileApi = async (profileData) => {
    const response = await api.put("/api/profile", profileData);
    return response.data;
};
