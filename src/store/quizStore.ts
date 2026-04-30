import { create } from "zustand";
import type { ProgramType } from "../utils/periods";

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
    available_options?: Record<string, string>;
    correct_option?: string;
    explanation?: string;
    topic_tags?: string[];
    topic?: string;
    difficulty?: "easy" | "medium" | "hard";
    year_source?: string;
    is_auto_gradable?: boolean;
    hint?: string;
}

export interface QuizAnswer {
    question_id: number;
    selected_option: string;
}

export type QuizMode = "practice" | "simulation" | "topic";
export type PracticeContentType = "quiz" | "past_exam";

export interface AttemptSummary {
    score: number;
    total?: number;
    percentage?: number;
    gradable_total: number;
    pending_count: number;
    topic_breakdown: Record<string, number>;
    weak_topics: string[];
}

interface QuizState {
    practiceContentType: PracticeContentType | null;
    departmentId: number | null;
    program: ProgramType | null;
    year: number | null;
    period: number | null;
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
    markedForReview: Record<number, boolean>;
    selectedAnswer: string | null;
    timeRemaining: number | null;
    isComplete: boolean;

    attemptSummary: AttemptSummary | null;

    setPracticeContentType: (type: PracticeContentType) => void;
    setQuizContext: (context: {
        departmentId: number;
        program: ProgramType;
        year: number;
        period: number;
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
    jumpToQuestion: (index: number) => void;
    toggleMarkedForReview: (questionId?: number) => void;
    nextQuestion: () => void;
    completeQuiz: (summary: AttemptSummary) => void;
    setTimeRemaining: (time: number) => void;
    resetAttempt: () => void;
    resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
    practiceContentType: null,
    departmentId: null,
    program: null,
    year: null,
    period: null,
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
    markedForReview: {},
    selectedAnswer: null,
    timeRemaining: null,
    isComplete: false,
    attemptSummary: null,

    setPracticeContentType: (practiceContentType) =>
        set({ practiceContentType }),

    setQuizContext: ({ departmentId, program, year, period, courseId, courseName }) =>
        set({
            departmentId,
            program,
            year,
            period,
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
            markedForReview: {},
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

    jumpToQuestion: (index) => {
        const { questions, answers } = get();
        const nextQuestion = questions[index];
        if (!nextQuestion) return;

        set({
            currentIndex: index,
            selectedAnswer: answers[nextQuestion.id] ?? null,
        });
    },

    toggleMarkedForReview: (questionId) => {
        const { currentIndex, questions, markedForReview } = get();
        const activeQuestionId = questionId ?? questions[currentIndex]?.id;
        if (!activeQuestionId) return;

        set({
            markedForReview: {
                ...markedForReview,
                [activeQuestionId]: !markedForReview[activeQuestionId],
            },
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
            markedForReview: {},
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
            program: null,
            year: null,
            period: null,
            questions: [],
            currentIndex: 0,
            answers: {},
            markedForReview: {},
            selectedAnswer: null,
            timeRemaining: null,
            isComplete: false,
            attemptSummary: null,
            courseId: null,
            courseName: null,
            practiceContentType: null,
            selectedQuizId: null,
            selectedQuizTitle: null,
            examPaperId: null,
            totalTime: null,
        }),
}));
