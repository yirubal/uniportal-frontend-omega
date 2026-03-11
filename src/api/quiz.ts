import client from "./client";
import { Question, QuizAnswer, QuizResult, QuizMode } from "../store/quizStore";

// ── Questions ─────────────────────────────────────────────────

export interface QuestionsParams {
    mode?: QuizMode;
    limit?: number;
    topic?: string;
}

export const getQuestions = async (
    courseId: number,
    params?: QuestionsParams
): Promise<Question[]> => {
    const response = await client.get<Question[]>(
        `/api/courses/${courseId}/questions/`,
        { params }
    );
    return response.data;
};

export const getExamQuestions = async (
    examPaperId: number
): Promise<Question[]> => {
    const response = await client.get<Question[]>(
        `/api/exams/${examPaperId}/questions/`
    );
    return response.data;
};

// ── Exam Papers ───────────────────────────────────────────────

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
    const response = await client.get<ExamPaper[]>("/api/exams/", { params });
    return response.data;
};

export const getExitExams = async (
    departmentId: number
): Promise<ExamPaper[]> => {
    const response = await client.get<ExamPaper[]>("/api/exit-exams/", {
        params: { department: departmentId },
    });
    return response.data;
};

export const getExitExamTopics = async (
    departmentId: number
): Promise<{ topic: string; count: number }[]> => {
    const response = await client.get("/api/exit-exams/topics/", {
        params: { department: departmentId },
    });
    return response.data;
};

// ── Attempts ──────────────────────────────────────────────────

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
    const response = await client.post<AttemptResponse>(
        "/api/quiz/attempts/",
        payload
    );
    return response.data;
};

export const getMyAttempts = async () => {
    const response = await client.get("/api/quiz/attempts/");
    return response.data;
};

// ── Performance ───────────────────────────────────────────────

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
    const response = await client.get<Performance>(
        "/api/students/me/performance/"
    );
    return response.data;
};

// ── Subscription ──────────────────────────────────────────────

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
    const response = await client.get<Plan[]>("/api/subscription/plans/");
    return response.data;
};

export const requestSubscription = async (
    planId: string
): Promise<PaymentInstructions> => {
    const response = await client.post<PaymentInstructions>(
        "/api/subscription/request/",
        { plan: planId }
    );
    return response.data;
};