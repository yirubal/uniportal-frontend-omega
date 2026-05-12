import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { useNetworkStore } from "../store/networkStore";

const SLOW_REQUEST_DELAY_MS = 700;
let slowRequestTimer: ReturnType<typeof setTimeout> | null = null;

function startNetworkTracking() {
    const networkStore = useNetworkStore.getState();
    networkStore.beginRequest();

    if (networkStore.pendingRequests === 0 && !slowRequestTimer) {
        slowRequestTimer = setTimeout(() => {
            const { pendingRequests, setShowSlowLoader } = useNetworkStore.getState();
            if (pendingRequests > 0) {
                setShowSlowLoader(true);
            }
            slowRequestTimer = null;
        }, SLOW_REQUEST_DELAY_MS);
    }
}

function stopNetworkTracking() {
    const networkStore = useNetworkStore.getState();
    networkStore.endRequest();

    const nextPendingRequests = Math.max(0, networkStore.pendingRequests - 1);
    if (nextPendingRequests === 0) {
        if (slowRequestTimer) {
            clearTimeout(slowRequestTimer);
            slowRequestTimer = null;
        }
        useNetworkStore.getState().setShowSlowLoader(false);
    }
}

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach JWT token to every request
client.interceptors.request.use(
    (config) => {
        startNetworkTracking();
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        stopNetworkTracking();
        return Promise.reject(error);
    }
);

// Response interceptor — handle global errors
client.interceptors.response.use(
    (response) => {
        stopNetworkTracking();
        return response;
    },
    (error) => {
        stopNetworkTracking();
        const status = error.response?.status;

        if (status === 401) {
            // Token expired or invalid — clear auth and reload
            useAuthStore.getState().clearAuth();
        }

        const requestPath = error.config?.url ?? "";
        const networkMessage =
            !error.response && error.message
                ? `${error.message}${requestPath ? ` while calling ${requestPath}` : ""}`
                : "";

        // Shape the error so every catch block gets a clean message
        const message =
            error.response?.data?.message ||
            error.response?.data?.detail ||
            error.response?.data?.error ||
            networkMessage ||
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
