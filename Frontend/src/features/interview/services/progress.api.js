import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
});

/**
 * @description Fetch current interview generation progress
 */
export const getProgress = async () => {
    const response = await api.get("/api/progress");
    return response.data;
};
