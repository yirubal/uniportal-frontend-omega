import { useAuthStore } from "../store/authStore";

const FREE_QUIZ_QUESTIONS_PER_DAY = 5;

export const useAccess = () => {
    const { student } = useAuthStore();

    const isPremium =
        student?.subscription_status === "premium" &&
        student?.subscription_expiry !== null &&
        new Date(student.subscription_expiry) > new Date();

    const daysRemaining = (() => {
        if (!student?.subscription_expiry) return 0;
        const expiry = new Date(student.subscription_expiry);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })();

    const canDownload = isPremium;

    const quizQuestionsRemaining = isPremium
        ? Infinity
        : Math.max(0, FREE_QUIZ_QUESTIONS_PER_DAY - (student?.downloads_today ?? 0));

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
        quizQuestionsRemaining,
        canAccessExitExam,
        canAccessPerformance,
        canAccessResource,
    };
};