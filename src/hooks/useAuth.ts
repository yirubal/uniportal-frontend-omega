import { useAuthStore } from "../store/authStore";
import { getMyProfile, loginWithDevMode, loginWithTelegram } from "../api/auth";
import { useTelegram } from "./useTelegram";

export const useAuth = () => {
    const { setAuth, setLoading, setError, clearAuth } = useAuthStore();
    const { initData } = useTelegram();

    const initAuth = async () => {
        try {
            setLoading(true);

            if (!initData) {
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

            const { token, student } = await loginWithTelegram(initData);
            setAuth(token, student);
        } catch (error) {
            console.error("Auth failed:", error);
            setError("Authentication failed. Please try again.");
        }
    };

    const logout = () => {
        clearAuth();
    };

    return { initAuth, logout };
};
