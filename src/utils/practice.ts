import type { PracticeContentType } from "../store/quizStore";

type PracticeContentMeta = {
    apiExamType: "quiz" | "final";
    navLabel: string;
    hubTitle: string;
    hubDescription: string;
    sectionLabel: string;
    setupTitle: string;
    setupDescription: string;
    listLabel: string;
    listDescription: string;
    emptyTitle: string;
    emptyDescription: string;
    attemptLabel: string;
    attemptFallbackTitle: string;
    resultsRetryLabel: string;
    resultsSummaryLabel: string;
};

const PRACTICE_CONTENT_META: Record<PracticeContentType, PracticeContentMeta> = {
    quiz: {
        apiExamType: "quiz",
        navLabel: "Take quiz",
        hubTitle: "Short quizzes",
        hubDescription: "Run focused quiz sets from your current courses.",
        sectionLabel: "Practice quiz",
        setupTitle: "Pick a course for quiz practice",
        setupDescription: "Choose the exact course, then we will show the short quiz sets available for it.",
        listLabel: "Available quizzes",
        listDescription: "Choose one quiz set, then open a focused attempt screen for it.",
        emptyTitle: "No quizzes yet",
        emptyDescription: "This course does not have quiz sets available right now.",
        attemptLabel: "Practice quiz",
        attemptFallbackTitle: "Quiz attempt",
        resultsRetryLabel: "Try another quiz",
        resultsSummaryLabel: "Quiz summary",
    },
    past_exam: {
        apiExamType: "final",
        navLabel: "Take past exam",
        hubTitle: "Past exams",
        hubDescription: "Open mixed-format past papers with true or false, fill-in, matching, essay, and choice questions.",
        sectionLabel: "Past exam practice",
        setupTitle: "Pick a course for past exam practice",
        setupDescription: "Choose a course first, then we will show the past exam papers available for it.",
        listLabel: "Available past exams",
        listDescription: "Past exam papers may include mixed question styles, not only multiple choice.",
        emptyTitle: "No past exams yet",
        emptyDescription: "This course does not have past exam papers available right now.",
        attemptLabel: "Past exam practice",
        attemptFallbackTitle: "Past exam attempt",
        resultsRetryLabel: "Try another past exam",
        resultsSummaryLabel: "Past exam summary",
    },
};

export function getPracticeContentMeta(type: PracticeContentType | null | undefined) {
    return type ? PRACTICE_CONTENT_META[type] : PRACTICE_CONTENT_META.quiz;
}
