import { create } from "zustand";

export type QuestionType =
    | "mcq"
    | "true_false"
    | "fill_blank"
    | "matching"
    | "essay";

export interface Question {
    id: number;
    text: string;
    question_type?: QuestionType;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e?: string;
    correct_option?: string;
    explanation?: string;
    topic_tags?: string[];
    topic?: string;
    difficulty?: "easy" | "medium" | "hard";
    hint?: string;
}

export interface QuizAnswer {
    question_id: number;
    selected_option: string;
}

export type QuizMode = "practice" | "simulation" | "topic";

export interface AttemptSummary {
    score: number;
    gradable_total: number;
    pending_count: number;
    topic_breakdown: Record<string, number>;
    weak_topics: string[];
}

interface QuizState {
    departmentId: number | null;
    year: number | null;
    semester: number | null;
    mode: QuizMode;
    courseId: number | null;
    courseName: string | null;
    selectedQuizId: number | null;
    selectedQuizTitle: string | null;
    examPaperId: number | null;
    totalTime: number | null;

    questions: Question[];
    currentIndex: number;
    answers: Record<number, string>;
    selectedAnswer: string | null;
    timeRemaining: number | null;
    isComplete: boolean;

    attemptSummary: AttemptSummary | null;

    setQuizContext: (context: {
        departmentId: number;
        year: number;
        semester: number;
        courseId: number;
        courseName: string;
    }) => void;
    setSelectedQuiz: (quizId: number, quizTitle: string) => void;
    setQuiz: (
        questions: Question[],
        mode: QuizMode,
        courseId?: number,
        examPaperId?: number,
        totalTime?: number
    ) => void;
    setAnswer: (answer: string) => void;
    nextQuestion: () => void;
    completeQuiz: (summary: AttemptSummary) => void;
    setTimeRemaining: (time: number) => void;
    resetAttempt: () => void;
    resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    departmentId: null,
    year: null,
    semester: null,
    mode: "practice",
    courseId: null,
    courseName: null,
    selectedQuizId: null,
    selectedQuizTitle: null,
    examPaperId: null,
    totalTime: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    selectedAnswer: null,
    timeRemaining: null,
    isComplete: false,
    attemptSummary: null,

    setQuizContext: ({ departmentId, year, semester, courseId, courseName }) =>
        set({
            departmentId,
            year,
            semester,
            courseId,
            courseName,
            selectedQuizId: null,
            selectedQuizTitle: null,
        }),

    setSelectedQuiz: (selectedQuizId, selectedQuizTitle) =>
        set({
            selectedQuizId,
            selectedQuizTitle,
        }),

    setQuiz: (questions, mode, courseId, examPaperId, totalTime) =>
        set({
            questions,
            mode,
            courseId: courseId ?? null,
            selectedQuizId: examPaperId ?? null,
            examPaperId: examPaperId ?? null,
            totalTime: totalTime ?? null,
            timeRemaining: totalTime ?? null,
            currentIndex: 0,
            answers: {},
            selectedAnswer: null,
            isComplete: false,
            attemptSummary: null,
        }),

    setAnswer: (answer) => {
        const { currentIndex, questions, answers } = get();
        const question = questions[currentIndex];
        if (!question) return;
        set({
            selectedAnswer: answer,
            answers: { ...answers, [question.id]: answer },
        });
    },

    nextQuestion: () => {
        const { currentIndex, questions } = get();
        if (currentIndex + 1 >= questions.length) {
            set({ isComplete: true });
        } else {
            set({
                currentIndex: currentIndex + 1,
                selectedAnswer: get().answers[questions[currentIndex + 1].id] ?? null,
            });
        }
    },

    completeQuiz: (attemptSummary) =>
        set({ attemptSummary, isComplete: true }),

    setTimeRemaining: (time) => set({ timeRemaining: time }),

    resetAttempt: () =>
        set({
            questions: [],
            currentIndex: 0,
            answers: {},
            selectedAnswer: null,
            timeRemaining: null,
            isComplete: false,
            attemptSummary: null,
            examPaperId: null,
            totalTime: null,
            selectedQuizId: null,
            selectedQuizTitle: null,
        }),

    resetQuiz: () =>
        set({
            departmentId: null,
            year: null,
            semester: null,
            questions: [],
            currentIndex: 0,
            answers: {},
            selectedAnswer: null,
            timeRemaining: null,
            isComplete: false,
            attemptSummary: null,
            courseId: null,
            courseName: null,
            selectedQuizId: null,
            selectedQuizTitle: null,
            examPaperId: null,
            totalTime: null,
        }),
}));
