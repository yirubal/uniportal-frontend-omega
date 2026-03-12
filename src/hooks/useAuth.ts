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
                // Dev mode fallback — bypasses Telegram auth so the app is
                // fully navigable in a browser during development.
                // REMOVE or guard with import.meta.env.DEV before production.
                console.warn("No Telegram initData — using dev-mode mock auth.");
                const mockStudent = {
                    id: 1,
                    telegram_id: 123456789,
                    first_name: "Dev",
                    last_name: "User",
                    username: "devuser",
                    preferred_department: 1,
                    preferred_year: 2,
                    preferred_semester: 1,
                    onboarding_complete: true,  // set false to test onboarding flow
                    subscription_status: "free" as const,
                    subscription_expiry: null,
                    downloads_today: 0,
                };
                setAuth("dev-token", mockStudent);
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