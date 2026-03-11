import axios from "axios";
import { useAuthStore } from "../store/authStore";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach JWT token to every request
client.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Token expired or invalid — clear auth and reload
            useAuthStore.getState().clearAuth();
        }

        // Shape the error so every catch block gets a clean message
        const message =
            error.response?.data?.message ||
            error.response?.data?.detail ||
            "Something went wrong. Please try again.";

        return Promise.reject({
            status,
            message,
            upgrade_required: error.response?.data?.upgrade_required ?? false,
            original: error,
        });
    }
);

export default client;