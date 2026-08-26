import axios from "axios";

/**
 * Determine the canonical base API URL:
 * 1. Explicit import.meta.env.VITE_API_BASE_URL (configured via Vercel/environment)
 * 2. Production safety guard: In production, reject accidental localhost URLs and use Render production URL
 * 3. Local development fallback: "http://localhost:3000"
 */
const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
        const trimmed = envUrl.trim().replace(/\/+$/, "");
        if (import.meta.env.PROD && (trimmed.includes("localhost") || trimmed.includes("127.0.0.1"))) {
            return "https://skillbridge-gsou.onrender.com";
        }
        return trimmed;
    }
    if (import.meta.env.PROD) {
        return "https://skillbridge-gsou.onrender.com";
    }
    return "http://localhost:3000";
};

export const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Optional token header attachment if present in storage, preserving withCredentials cookies
apiClient.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("token");
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch {
        // Fall back gracefully if localStorage is unavailable
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;
