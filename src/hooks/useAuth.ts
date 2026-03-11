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
                // Dev mode fallback — remove before production
                console.warn("No Telegram initData found. Are you testing outside Telegram?");
                setError("Please open this app inside Telegram.");
                return;
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