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
    const percentage = Math.round((score / total) * 100);
    return `${score}/${total} (${percentage}%)`;
};

export const formatETB = (amount: number): string => {
    return `ETB ${amount.toLocaleString()}`;
};

export const formatDaysRemaining = (days: number): string => {
    if (days === 0) return "Expires today";
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

export const getScoreEmoji = (percentage: number): string => {
    if (percentage >= 90) return "🏆";
    if (percentage >= 75) return "🌟";
    if (percentage >= 60) return "👍";
    if (percentage >= 50) return "📖";
    return "💪";
};

export const getScoreMessage = (percentage: number): string => {
    if (percentage >= 90) return "Outstanding!";
    if (percentage >= 75) return "Great work!";
    if (percentage >= 60) return "Good effort!";
    if (percentage >= 50) return "Keep studying!";
    return "Don't give up!";
};

export const getFileTypeColor = (
    type: string
): { bg: string; text: string; dot: string } => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
        lecture_note: {
            bg: "#E8F4FD",
            text: "#1565C0",
            dot: "#2196F3",
        },
        worksheet: {
            bg: "#FFF3E0",
            text: "#E65100",
            dot: "#FF9800",
        },
        module: {
            bg: "#EAF4F1",
            text: "#3F6F6A",
            dot: "#3F6F6A",
        },
        past_exam: {
            bg: "#F3E5F5",
            text: "#6A1B9A",
            dot: "#9C27B0",
        },
        exit_exam: {
            bg: "#E8F5E9",
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
