import { useAuthStore } from "../store/authStore";
import { loginWithTelegram } from "../api/auth";
import { useTelegram } from "./useTelegram";

export const useAuth = () => {
    const { setAuth, setLoading, setError, clearAuth } = useAuthStore();
    const { initData } = useTelegram();

    const initAuth = async () => {
        try {
            setLoading(true);

            if (!initData) {
                console.warn("No Telegram initData — using dev-mode mock auth.");
                if (import.meta.env.DEV) {
                    const { MOCK_STUDENT } = await import("../api/devMocks");
                    setAuth("dev-token", MOCK_STUDENT);
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
