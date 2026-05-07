import { useAuthStore } from "../store/authStore";

export const useAccess = () => {
    const { student } = useAuthStore();

    const expiryTime = student?.subscription_expiry
        ? new Date(student.subscription_expiry).getTime()
        : Number.NaN;
    const hasActiveExpiry =
        Number.isFinite(expiryTime) && expiryTime > Date.now();
    const isPremium = Boolean(student?.is_premium && hasActiveExpiry);

    const daysRemaining = (() => {
        if (!student?.subscription_expiry) return 0;
        const expiry = new Date(student.subscription_expiry);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })();

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
