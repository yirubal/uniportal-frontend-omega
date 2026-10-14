import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import type { Course } from "./contentStore";
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

export type QuizMode = "practice" | "simulation" | "topic" | "selective";
export type PracticeContentType = "quiz" | "past_exam";

export interface AttemptSummary {
    score: number;
    total?: number;
    percentage?: number;
    gradable_total: number;
    pending_count: number;
    topic_breakdown: Record<string, number>;
    weak_topics: string[];
    detailed_answers?: Record<string, AttemptAnswerDetail>;
}

export interface AttemptAnswerDetail {
    question_text?: string;
    options?: Record<string, string>;
    selected_option?: string | null;
    correct_option?: string | null;
    is_correct?: boolean | null;
    explanation?: string | null;
    topic_tags?: string[];
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
    /** Epoch ms when a timed attempt ends. Timers derive the time left from this, so it cannot drift. */
    deadline: number | null;
    /** telegram_id of the student who started the attempt, so a saved attempt is never resumed by someone else. */
    ownerId: number | null;
    selectedTopics: string[];

    questions: Question[];
    currentIndex: number;
    answers: Record<number, string>;
    markedForReview: Record<number, boolean>;
    selectedAnswer: string | null;
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
    setCourseContext: (courseId: number | null, courseName: string | null) => void;
    setQuiz: (
        questions: Question[],
        mode: QuizMode,
        courseId?: number,
        examPaperId?: number,
        totalTime?: number
    ) => void;
    initializeSelectivePractice: (questions: Question[], course: Course, topics: string[]) => void;
    /** Saves an answer for `questionId` (defaults to the current question). */
    setAnswer: (answer: string, questionId?: number) => void;
    jumpToQuestion: (index: number) => void;
    toggleMarkedForReview: (questionId?: number) => void;
    nextQuestion: () => void;
    completeQuiz: (summary: AttemptSummary) => void;
    resetAttempt: () => void;
    resetQuiz: () => void;
}

/** Saved attempts older than this are discarded on load. */
const SAVED_ATTEMPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const QUIZ_STORAGE_KEY = "uniportal-quiz-attempt";

function currentOwnerId() {
    return useAuthStore.getState().student?.telegram_id ?? null;
}

type PersistedQuizState = Partial<QuizState> & { savedAt?: number };

export const useQuizStore = create<QuizState>()(persist((set, get) => ({
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
    deadline: null,
    ownerId: null,
    selectedTopics: [],
    questions: [],
    currentIndex: 0,
    answers: {},
    markedForReview: {},
    selectedAnswer: null,
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

    setCourseContext: (courseId, courseName) =>
        set({ courseId, courseName }),

    setQuiz: (questions, mode, courseId, examPaperId, totalTime) =>
        set({
            questions,
            mode,
            courseId: courseId ?? null,
            selectedQuizId: examPaperId ?? null,
            examPaperId: examPaperId ?? null,
            totalTime: totalTime ?? null,
            deadline: totalTime ? Date.now() + totalTime * 1000 : null,
            ownerId: currentOwnerId(),
            selectedTopics: [],
            currentIndex: 0,
            answers: {},
            markedForReview: {},
            selectedAnswer: null,
            isComplete: false,
            attemptSummary: null,
        }),

    initializeSelectivePractice: (questions, course, selectedTopics) =>
        set({
            practiceContentType: "quiz",
            questions,
            mode: "selective",
            courseId: course.id,
            courseName: course.name,
            selectedQuizId: null,
            selectedQuizTitle: "Selective Practice",
            examPaperId: null,
            totalTime: null,
                    deadline: null,
            ownerId: currentOwnerId(),
            selectedTopics,
            currentIndex: 0,
            answers: {},
            markedForReview: {},
            selectedAnswer: null,
            isComplete: false,
            attemptSummary: null,
        }),

    setAnswer: (answer, questionId) => {
        const { currentIndex, questions, answers } = get();
        const currentQuestionId = questions[currentIndex]?.id;
        const targetId = questionId ?? currentQuestionId;
        if (targetId === undefined) return;
        set({
            // A debounced text answer can arrive after moving on; only the current question drives selectedAnswer.
            ...(targetId === currentQuestionId ? { selectedAnswer: answer } : {}),
            answers: { ...answers, [targetId]: answer },
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

    resetAttempt: () =>
        set({
            questions: [],
            currentIndex: 0,
            answers: {},
            markedForReview: {},
            selectedAnswer: null,
                    isComplete: false,
            attemptSummary: null,
            examPaperId: null,
            totalTime: null,
            deadline: null,
            ownerId: null,
            selectedQuizId: null,
            selectedQuizTitle: null,
            selectedTopics: [],
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
                    isComplete: false,
            attemptSummary: null,
            courseId: null,
            courseName: null,
            practiceContentType: null,
            selectedQuizId: null,
            selectedQuizTitle: null,
            examPaperId: null,
            totalTime: null,
            deadline: null,
            ownerId: null,
            selectedTopics: [],
        }),
}), {
    // Keep the attempt across reloads and WebView restarts. localStorage (not sessionStorage) so that
    // closing and reopening the Mini App can still resume a timed exam before its deadline.
    name: QUIZ_STORAGE_KEY,
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: (state): PersistedQuizState => {
        // Only an attempt with questions is worth saving; otherwise clear what was stored.
        if (state.questions.length === 0) return {};

        return {
            practiceContentType: state.practiceContentType,
            departmentId: state.departmentId,
            program: state.program,
            year: state.year,
            period: state.period,
            mode: state.mode,
            courseId: state.courseId,
            courseName: state.courseName,
            selectedQuizId: state.selectedQuizId,
            selectedQuizTitle: state.selectedQuizTitle,
            examPaperId: state.examPaperId,
            totalTime: state.totalTime,
            deadline: state.deadline,
            ownerId: state.ownerId,
            selectedTopics: state.selectedTopics,
            questions: state.questions,
            currentIndex: state.currentIndex,
            answers: state.answers,
            markedForReview: state.markedForReview,
            selectedAnswer: state.selectedAnswer,
            isComplete: state.isComplete,
            attemptSummary: state.attemptSummary,
            savedAt: Date.now(),
        };
    },
    merge: (persisted, current) => {
        const saved = persisted as PersistedQuizState | undefined;
        if (!saved?.questions?.length || !saved.savedAt) return current;
        if (Date.now() - saved.savedAt > SAVED_ATTEMPT_MAX_AGE_MS) return current;

        const { savedAt: _savedAt, ...attempt } = saved;
        return { ...current, ...attempt };
    },
}));

/** Route that reopens an unfinished attempt, or null when the store holds nothing to resume for this student. */
export function getResumeRoute(state: QuizState, studentId: number | null | undefined): string | null {
    if (state.questions.length === 0 || state.isComplete) return null;
    if (!studentId || state.ownerId !== studentId) return null;

    if (state.mode === "simulation" && state.examPaperId) return `/simulate/${state.examPaperId}`;
    if (state.mode === "selective") return "/quiz/selective/take";
    if (state.examPaperId) return `/quiz/take/${state.examPaperId}`;
    return null;
}
