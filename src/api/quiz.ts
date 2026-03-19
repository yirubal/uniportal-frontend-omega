import client from "./client";
import { Question, QuizAnswer, QuizResult, QuizMode } from "../store/quizStore";

const isDev = import.meta.env.DEV;

async function getMocks() {
    if (!isDev) return null;
    return import("./devMocks");
}

export interface QuestionsParams {
    mode?: QuizMode;
    limit?: number;
    topic?: string;
}

export const getQuestions = async (
    courseId: number,
    params?: QuestionsParams
): Promise<Question[]> => {
    try {
        const response = await client.get<Question[]>(
            `/api/courses/${courseId}/questions/`,
            { params }
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock questions");
            return mocks.getMockQuestions(courseId, params);
        }
        throw err;
    }
};

export const getExamQuestions = async (
    examPaperId: number
): Promise<Question[]> => {
    try {
        const response = await client.get<Question[]>(
            `/api/exams/${examPaperId}/questions/`
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock exam questions");
            return mocks.getMockExamQuestions(examPaperId);
        }
        throw err;
    }
};

export interface ExamPaper {
    id: number;
    title: string;
    course: number;
    exam_type: "final" | "exit";
    year: number;
    duration_minutes: number;
    total_questions: number;
    access_level: "free" | "premium";
}

export interface ExamPapersParams {
    type?: "final" | "exit";
    department?: number;
}

export const getExamPapers = async (
    params?: ExamPapersParams
): Promise<ExamPaper[]> => {
    try {
        const response = await client.get<ExamPaper[]>("/api/exams/", { params });
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock exam papers");
            return mocks.MOCK_EXAM_PAPERS.filter((exam) => {
                if (params?.type && exam.exam_type !== params.type) return false;
                if (params?.department) {
                    const course = mocks.MOCK_COURSES.find((item) => item.id === exam.course);
                    return course?.department === params.department;
                }
                return true;
            });
        }
        throw err;
    }
};

export const getExitExams = async (
    departmentId: number
): Promise<ExamPaper[]> => {
    try {
        const response = await client.get<ExamPaper[]>("/api/exit-exams/", {
            params: { department: departmentId },
        });
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock exit exams");
            return mocks.MOCK_EXAM_PAPERS.filter((exam) => {
                if (exam.exam_type !== "exit") return false;
                const course = mocks.MOCK_COURSES.find((item) => item.id === exam.course);
                return course?.department === departmentId;
            });
        }
        throw err;
    }
};

export const getExitExamTopics = async (
    departmentId: number
): Promise<{ topic: string; count: number }[]> => {
    try {
        const response = await client.get("/api/exit-exams/topics/", {
            params: { department: departmentId },
        });
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock exit exam topics");
            return mocks.getMockExitExamTopics(departmentId);
        }
        throw err;
    }
};

export interface SubmitAttemptPayload {
    course_id?: number;
    exam_paper_id?: number;
    answers: QuizAnswer[];
    mode: QuizMode;
}

export interface AttemptResponse {
    score: number;
    total: number;
    percentage: number;
    results: QuizResult[];
}

export const submitAttempt = async (
    payload: SubmitAttemptPayload
): Promise<AttemptResponse> => {
    try {
        const response = await client.post<AttemptResponse>(
            "/api/quiz/attempts/",
            payload
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Evaluating mock attempt");
            const questions = payload.exam_paper_id
                ? mocks.getMockExamQuestions(payload.exam_paper_id)
                : mocks.getMockQuestions(payload.course_id ?? 0, { limit: payload.answers.length || undefined });

            return mocks.evaluateMockAttempt(questions, payload.answers, payload.mode);
        }
        throw err;
    }
};

export const getMyAttempts = async () => {
    try {
        const response = await client.get("/api/quiz/attempts/");
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock attempts");
            return [
                { id: 1, score: 7, total: 10, mode: "practice", created_at: "2026-03-01T09:20:00Z" },
                { id: 2, score: 5, total: 6, mode: "simulation", created_at: "2026-03-10T14:10:00Z" },
            ];
        }
        throw err;
    }
};

export interface Performance {
    total_attempts: number;
    average_score: number;
    best_score: number;
    weak_topics: string[];
    score_over_time: { date: string; score: number }[];
    attempts_by_course: {
        course_name: string;
        attempts: number;
        average: number;
    }[];
}

export const getMyPerformance = async (): Promise<Performance> => {
    try {
        const response = await client.get<Performance>(
            "/api/students/me/performance/"
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock performance");
            return mocks.MOCK_PERFORMANCE;
        }
        throw err;
    }
};

export interface Plan {
    id: string;
    name: string;
    price: number;
    days: number;
    description: string;
}

export interface PaymentInstructions {
    instructions: string;
    reference: string;
    note: string;
}

export const getPlans = async (): Promise<Plan[]> => {
    try {
        const response = await client.get<Plan[]>("/api/subscription/plans/");
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock plans");
            return mocks.MOCK_PLANS;
        }
        throw err;
    }
};

export const requestSubscription = async (
    planId: string
): Promise<PaymentInstructions> => {
    try {
        const response = await client.post<PaymentInstructions>(
            "/api/subscription/request/",
            { plan: planId }
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock subscription instructions");
            return {
                ...mocks.MOCK_PAYMENT_INSTRUCTIONS,
                reference: `${mocks.MOCK_PAYMENT_INSTRUCTIONS.reference}-${planId.toUpperCase()}`,
            };
        }
        throw err;
    }
};
