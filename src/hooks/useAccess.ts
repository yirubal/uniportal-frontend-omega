import { useAuthStore } from "../store/authStore";
import { getSubscriptionAccess } from "../utils/subscription";

export const useAccess = () => {
    const student = useAuthStore((state) => state.student);
    const { isPremium, daysRemaining } = getSubscriptionAccess(student);

    const canDownload = isPremium;
    const canAccessExitExam = isPremium;
    const canAccessPerformance = isPremium;

    const canAccessResource = (accessLevel: "free" | "premium") => {
        if (accessLevel === "free") return true;
        return isPremium;
    };

    return {
        isPremium,
        daysRemaining,
        canDownload,
        canAccessExitExam,
        canAccessPerformance,
        canAccessResource,
    };
};
