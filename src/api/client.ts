import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { useNetworkStore } from "../store/networkStore";

declare module "axios" {
    export interface AxiosRequestConfig {
        skipGlobalLoader?: boolean;
        skipAuthClear?: boolean;
    }

    export interface InternalAxiosRequestConfig {
        skipGlobalLoader?: boolean;
        skipAuthClear?: boolean;
    }
}

/** Shape of every error rejected by this client. */
export interface ApiError {
    status: number | undefined;
    message: string;
    upgrade_required: boolean;
    /** No HTTP response arrived (offline, DNS, CORS, timeout). */
    network: boolean;
    /** The request was cancelled through an AbortSignal. */
    aborted: boolean;
    original: unknown;
}

export const REQUEST_TIMEOUT_MS = 15_000;
const SLOW_REQUEST_DELAY_MS = 700;
let slowRequestTimer: ReturnType<typeof setTimeout> | null = null;

function isApiError(error: unknown): error is ApiError {
    return Boolean(error && typeof error === "object" && "network" in error && "aborted" in error);
}

/** The backend could not be reached at all. Cancelled requests do not count. */
export function isNetworkError(error: unknown): boolean {
    return isApiError(error) && error.network && !error.aborted;
}

/** The request was cancelled (e.g. an effect cleanup aborted it); callers should ignore it. */
export function isAbortError(error: unknown): boolean {
    return isApiError(error) && error.aborted;
}

function startNetworkTracking() {
    useNetworkStore.getState().beginRequest();

    if (!slowRequestTimer) {
        slowRequestTimer = setTimeout(() => {
            slowRequestTimer = null;
            const { pendingRequests, setShowSlowLoader } = useNetworkStore.getState();
            if (pendingRequests > 0) {
                setShowSlowLoader(true);
            }
        }, SLOW_REQUEST_DELAY_MS);
    }
}

function stopNetworkTracking() {
    useNetworkStore.getState().endRequest();

    // Read the count after the decrement instead of predicting it from a stale snapshot.
    if (useNetworkStore.getState().pendingRequests === 0) {
        if (slowRequestTimer) {
            clearTimeout(slowRequestTimer);
            slowRequestTimer = null;
        }
        useNetworkStore.getState().setShowSlowLoader(false);
    }
}

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach JWT token to every request
client.interceptors.request.use((config) => {
    if (!config.skipGlobalLoader) {
        startNetworkTracking();
    }
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — handle global errors
client.interceptors.response.use(
    (response) => {
        if (!response.config.skipGlobalLoader) {
            stopNetworkTracking();
        }
        return response;
    },
    (error) => {
        if (!error.config?.skipGlobalLoader) {
            stopNetworkTracking();
        }
        const status = error.response?.status;
        const aborted = axios.isCancel(error);
        const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

        if (status === 401 && !error.config?.skipAuthClear) {
            // Token expired or invalid — App re-authenticates once, then Splash offers "Try again"
            useAuthStore.getState().expireSession();
        }

        const requestPath = error.config?.url ?? "";
        const networkMessage = timedOut
            ? "The server took too long to respond. Please try again."
            : !error.response && error.message
                ? `${error.message}${requestPath ? ` while calling ${requestPath}` : ""}`
                : "";

        // Shape the error so every catch block gets a clean message
        const message =
            error.response?.data?.message ||
            error.response?.data?.detail ||
            error.response?.data?.error ||
            networkMessage ||
            "Something went wrong. Please try again.";

        const shaped: ApiError = {
            status,
            message,
            upgrade_required: error.response?.data?.upgrade_required ?? false,
            network: !error.response,
            aborted,
            original: error,
        };

        return Promise.reject(shaped);
    }
);

export default client;
