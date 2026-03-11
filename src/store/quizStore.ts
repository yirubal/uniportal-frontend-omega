import { create } from "zustand";

export interface Question {
    id: number;
    text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option?: "a" | "b" | "c" | "d";
    explanation?: string;
    topic_tags?: string[];
}

export interface QuizAnswer {
    question_id: number;
    selected_option: "a" | "b" | "c" | "d";
}

export interface QuizResult {
    question: Question;
    selected_option: "a" | "b" | "c" | "d";
    is_correct: boolean;
}

export type QuizMode = "practice" | "simulation" | "topic";

interface QuizState {
    // Quiz config
    mode: QuizMode;
    courseId: number | null;
    examPaperId: number | null;
    totalTime: number | null;   // seconds, for simulation

    // Active quiz
    questions: Question[];
    currentIndex: number;
    answers: Record<number, "a" | "b" | "c" | "d">;
    selectedOption: "a" | "b" | "c" | "d" | null;
    showExplanation: boolean;
    timeRemaining: number | null;
    isComplete: boolean;

    // Results
    score: number;
    results: QuizResult[];

    // Actions
    setQuiz: (
        questions: Question[],
        mode: QuizMode,
        courseId?: number,
        examPaperId?: number,
        totalTime?: number
    ) => void;
    setAnswer: (option: "a" | "b" | "c" | "d") => void;
    nextQuestion: () => void;
    completeQuiz: (score: number, results: QuizResult[]) => void;
    setTimeRemaining: (time: number) => void;
    resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    mode: "practice",
    courseId: null,
    examPaperId: null,
    totalTime: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    selectedOption: null,
    showExplanation: false,
    timeRemaining: null,
    isComplete: false,
    score: 0,
    results: [],

    setQuiz: (questions, mode, courseId, examPaperId, totalTime) =>
        set({
            questions,
            mode,
            courseId: courseId ?? null,
            examPaperId: examPaperId ?? null,
            totalTime: totalTime ?? null,
            timeRemaining: totalTime ?? null,
            currentIndex: 0,
            answers: {},
            selectedOption: null,
            showExplanation: false,
            isComplete: false,
            score: 0,
            results: [],
        }),

    setAnswer: (option) => {
        const { currentIndex, questions, answers } = get();
        const question = questions[currentIndex];
        if (!question) return;
        set({
            selectedOption: option,
            showExplanation: true,
            answers: { ...answers, [question.id]: option },
        });
    },

    nextQuestion: () => {
        const { currentIndex, questions } = get();
        if (currentIndex + 1 >= questions.length) {
            set({ isComplete: true });
        } else {
            set({
                currentIndex: currentIndex + 1,
                selectedOption: null,
                showExplanation: false,
            });
        }
    },

    completeQuiz: (score, results) =>
        set({ score, results, isComplete: true }),

    setTimeRemaining: (time) => set({ timeRemaining: time }),

    resetQuiz: () =>
        set({
            questions: [],
            currentIndex: 0,
            answers: {},
            selectedOption: null,
            showExplanation: false,
            timeRemaining: null,
            isComplete: false,
            score: 0,
            results: [],
            courseId: null,
            examPaperId: null,
        }),
}));