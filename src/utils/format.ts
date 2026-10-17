export const formatFileType = (type: string): string => {
    const map: Record<string, string> = {
        lecture_note: "Lecture Notes",
        worksheet: "Worksheet",
        module: "Module",
        past_exam: "Past Exam",
        exit_exam: "Exit Exam",
    };
    return map[type] || type;
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const formatScore = (score: number, total: number): string => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    return `${score}/${total} (${percentage}%)`;
};

export const formatETB = (amount: number): string => {
    return `ETB ${amount.toLocaleString()}`;
};

export const formatDaysRemaining = (days: number): string => {
    if (days <= 0) return "Expired";
    if (days === 1) return "1 day remaining";
    if (days < 7) return `${days} days remaining`;
    if (days < 30) return `${Math.floor(days / 7)} weeks remaining`;
    return `${Math.floor(days / 30)} months remaining`;
};

export const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const formatTimeRemaining = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/** Score (in %) at which an attempt or topic counts as passed. One value for the label, ring and topic badges. */
export const PASS_PERCENTAGE = 50;

export const getScoreEmoji = (percentage: number): string => {
    if (percentage >= 100) return "🎉";
    if (percentage >= 90) return "🏆";
    if (percentage >= 75) return "🌟";
    if (percentage >= 60) return "👍";
    if (percentage >= 50) return "📖";
    return "💪";
};

export const getScoreMessage = (percentage: number): string => {
    if (percentage >= 100) return "Perfect score!";
    if (percentage >= 90) return "Outstanding!";
    if (percentage >= 75) return "Great work!";
    if (percentage >= 60) return "Good effort!";
    if (percentage >= 50) return "Keep studying!";
    return "Don't give up!";
};

/** `bg` tints the type colour into the card surface, so it works in light and dark mode. */
export const getFileTypeColor = (
    type: string
): { bg: string; text: string; dot: string } => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
        lecture_note: {
            bg: "color-mix(in srgb, #2196F3 14%, var(--color-card))",
            text: "#1565C0",
            dot: "#2196F3",
        },
        worksheet: {
            bg: "color-mix(in srgb, #FF9800 14%, var(--color-card))",
            text: "#E65100",
            dot: "#FF9800",
        },
        module: {
            bg: "color-mix(in srgb, #3F6F6A 14%, var(--color-card))",
            text: "#3F6F6A",
            dot: "#3F6F6A",
        },
        past_exam: {
            bg: "color-mix(in srgb, #9C27B0 14%, var(--color-card))",
            text: "#6A1B9A",
            dot: "#9C27B0",
        },
        exit_exam: {
            bg: "color-mix(in srgb, #4CAF50 14%, var(--color-card))",
            text: "#1B5E20",
            dot: "#4CAF50",
        },
    };
    return colors[type] || colors.lecture_note;
};

export const getFileTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
        lecture_note: "📄",
        worksheet: "📝",
        module: "📘",
        past_exam: "📋",
        exit_exam: "🎯",
    };
    return icons[type] || "📄";
};

export const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
};

/** Whole seconds until an epoch-ms deadline, never negative. */
export const getSecondsUntil = (deadline: number): number =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
