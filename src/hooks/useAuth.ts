import { useAuthStore } from "../store/authStore";
import {
    getMyProfile,
    isChannelRequiredError,
    isMissingTelegramInitDataError,
    loginWithDevMode,
    loginWithTelegram,
} from "../api/auth";

interface InitAuthOptions {
    /** Skip the global loading state so the current screen (e.g. ChannelGateScreen) stays mounted. */
    silent?: boolean;
}

let inFlight: Promise<void> | null = null;

async function runAuth({ silent = false }: InitAuthOptions) {
    const { setAuth, setLoading, setError, setChannelRequired } = useAuthStore.getState();

    try {
        if (!silent) setLoading(true);

        try {
            const { token, student } = await loginWithTelegram();
            setAuth(token, student);
            return;
        } catch (error) {
            // 1. Channel gate: user hasn't joined the required channel yet
            if (isChannelRequiredError(error)) {
                setChannelRequired(error.channelUrl);
                return;
            }

            if (!isMissingTelegramInitDataError(error)) {
                throw error;
            }

            if (import.meta.env.DEV) {
                if (import.meta.env.VITE_FORCE_DEV_MOCKS === "true") {
                    console.warn("No Telegram initData - using local mock auth.");
                    const student = await getMyProfile();
                    setAuth("dev-token", student);
                    return;
                }

                console.warn("No Telegram initData - using backend dev-mode auth.");
                const { token, student } = await loginWithDevMode();
                setAuth(token, student);
                return;
            }
            throw new Error("Telegram initData is required outside development mode.");
        }
    } catch (error) {
        console.error("Auth failed:", error);
        setError("Authentication failed. Please try again.");
    }
}

/**
 * Logs in once at a time. Concurrent callers (StrictMode double effects, Splash retry,
 * the channel gate, session-expiry re-auth) share the same request instead of racing.
 */
export function initAuth(options: InitAuthOptions = {}): Promise<void> {
    if (!inFlight) {
        inFlight = runAuth(options).finally(() => {
            inFlight = null;
        });
    }
    return inFlight;
}

export const useAuth = () => {
    const logout = () => {
        useAuthStore.getState().clearAuth();
    };

    return { initAuth, logout };
};
