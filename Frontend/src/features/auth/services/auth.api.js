import api from "../../../services/apiClient";

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        });
        if (response.data?.token) {
            try { localStorage.setItem("token", response.data.token); } catch {}
        }
        return response.data;
    } catch (err) {
        console.error("Register error:", err);
        throw err;
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email, password
        });
        if (response.data?.token) {
            try { localStorage.setItem("token", response.data.token); } catch {}
        }
        return response.data;
    } catch (err) {
        console.error("Login error:", err);
        throw err;
    }
}

export async function googleLogin({ credential }) {
    const response = await api.post("/api/auth/google", { credential });
    if (response.data?.token) {
        try { localStorage.setItem("token", response.data.token); } catch {}
    }
    return response.data;
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout");
        try { localStorage.removeItem("token"); } catch {}
        return response.data;
    } catch (err) {
        console.error("Logout error:", err);
        try { localStorage.removeItem("token"); } catch {}
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me");
        return response.data;
    } catch (err) {
        console.error("getMe error:", err);
        throw err;
    }
}