import client from "./client";
import {
    AttemptSummary,
    PracticeContentType,
    Question,
    QuizMode,
} from "../store/quizStore";
import type { ExitExamCategory } from "../utils/exitExams";
import { getPracticeContentMeta } from "../utils/practice";

const isDev = import.meta.env.DEV;
const forceDevMocks = import.meta.env.VITE_FORCE_DEV_MOCKS === "true";
const isLocalDevHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

async function getMocks() {
    if (!isDev) return null;
    return import("./devMocks");
}

export const getExamQuestions = async (
    examPaperId: number,
    mode: "practice" | "simulation" = "practice"
): Promise<Question[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock exam questions");
            return mocks.getMockExamQuestions(examPaperId);
        }
    }

    try {
        const response = await client.get<Question[]>(
            `/api/exams/${examPaperId}/questions/`,
            { params: { mode } }
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
    exam_type: "quiz" | "final" | "exit" | "exit_real" | "exit_model";
    exit_category?: ExitExamCategory | null;
    year: number;
    duration_minutes: number;
    total_questions: number;
    access_level: "free" | "premium";
}

export interface ExamPapersParams {
    type?: ExamPaper["exam_type"];
    department?: number;
    course?: number;
}

function dedupeExamPapers(exams: ExamPaper[]) {
    return Array.from(new Map(exams.map((exam) => [exam.id, exam])).values());
}

export const getExamPapers = async (
    params?: ExamPapersParams
): Promise<ExamPaper[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock exam papers");
            return mocks.MOCK_EXAM_PAPERS.filter((exam) => {
                if (params?.type && exam.exam_type !== params.type) return false;
                if (params?.course && exam.course !== params.course) return false;
                if (params?.department) {
                    const course = mocks.MOCK_COURSES.find((item) => item.id === exam.course);
                    return course?.department === params.department;
                }
                return true;
            });
        }
    }

    try {
        const response = await client.get<ExamPaper[]>("/api/exams/", { params });
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock exam papers");
            return mocks.MOCK_EXAM_PAPERS.filter((exam) => {
                if (params?.type && exam.exam_type !== params.type) return false;
                if (params?.course && exam.course !== params.course) return false;
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

export const getCourseQuizzes = async (
    courseId: number
): Promise<ExamPaper[]> => {
    return getExamPapers({ type: "quiz", course: courseId });
};

export const getCoursePracticePapers = async (
    courseId: number,
    practiceContentType: PracticeContentType
): Promise<ExamPaper[]> => {
    return getExamPapers({
        type: getPracticeContentMeta(practiceContentType).apiExamType,
        course: courseId,
    });
};

export const getExitExams = async (
    departmentId?: number
): Promise<ExamPaper[]> => {
    const params = departmentId ? { department: departmentId } : undefined;
    const [officialExams, modelExams] = await Promise.all([
        getExamPapers({ ...params, type: "exit_real" }),
        getExamPapers({ ...params, type: "exit_model" }),
    ]);
    const exitExams = dedupeExamPapers([...officialExams, ...modelExams]);

    if (exitExams.length > 0) return exitExams;

    return getExamPapers({ ...params, type: "exit" });
};

export const getExitExamTopics = async (
    departmentId: number
): Promise<{ topic: string; count: number }[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock exit exam topics");
            return mocks.getMockExitExamTopics(departmentId);
        }
    }

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
    exam_paper?: number;
    answers: Record<string, string>;
    mode: QuizMode;
}

export interface AttemptResponse extends AttemptSummary {}

export const submitAttempt = async (
    payload: SubmitAttemptPayload
): Promise<AttemptResponse> => {
    const requestPayload = {
        exam_paper_id: payload.exam_paper,
        mode: payload.mode,
        answers: Object.entries(payload.answers).map(([questionId, selected]) => ({
            question_id: Number(questionId),
            selected_option: selected,
        })),
    };

    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force evaluating mock attempt");
            const questions = payload.exam_paper
                ? mocks.getMockExamQuestions(payload.exam_paper)
                : [];
            return mocks.evaluateMockAttempt(questions, requestPayload.answers, payload.mode);
        }
    }

    try {
        const response = await client.post<AttemptResponse>(
            "/api/quiz/attempts/",
            requestPayload
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Evaluating mock attempt");
            const questions = payload.exam_paper
                ? mocks.getMockExamQuestions(payload.exam_paper)
                : [];
            return mocks.evaluateMockAttempt(questions, requestPayload.answers, payload.mode);
        }
        throw err;
    }
};

export const getExitExamTopicQuestions = async (
    departmentId: number,
    topic: string
): Promise<Question[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock exit exam topic questions");
            return mocks.getMockExitExamTopicQuestions(departmentId, topic);
        }
    }

    try {
        const response = await client.get<Question[]>("/api/exit-exams/topics/questions/", {
            params: { department: departmentId, topic },
        });
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock exit exam topic questions");
            return mocks.getMockExitExamTopicQuestions(departmentId, topic);
        }
        throw err;
    }
};

export const getMyAttempts = async () => {
    if (forceDevMocks || (isDev && isLocalDevHost)) {
        console.info("[dev] Using mock attempts");
        return [
            { id: 1, score: 7, total: 10, mode: "practice", created_at: "2026-03-01T09:20:00Z" },
            { id: 2, score: 5, total: 6, mode: "simulation", created_at: "2026-03-10T14:10:00Z" },
        ];
    }

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
    if (forceDevMocks || (isDev && isLocalDevHost)) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock performance");
            return mocks.MOCK_PERFORMANCE;
        }
    }

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

export interface PaymentOptions {
    telebirr?: {
        number: string;
        name?: string;
    };
    cbe?: {
        account: string;
        name?: string;
    };
}

export interface PaymentDestination {
    method: "telebirr" | "cbe";
    label: string;
    value: string;
    name: string;
}

export interface PaymentInstructions {
    reference?: string;
    plan?: string;
    amount?: number;
    days?: number;
    status: "pending" | "approved" | "rejected";
    payment_method?: "telebirr" | "cbe";
    payment_reference?: string;
    payment_destination?: PaymentDestination | null;
    note?: string;
    instructions?: string;
    payment_options?: PaymentOptions;
}

export interface SubscriptionRequestState {
    current_request: PaymentInstructions | null;
    has_pending_request: boolean;
    pending_request: PaymentInstructions | null;
    payment_options?: PaymentOptions;
    additional_instructions?: string;
}

interface SubscriptionRequestResponse {
    current_request?: PaymentInstructions | null;
    has_pending_request?: boolean;
    pending_request?: PaymentInstructions | null;
    payment_options?: PaymentOptions;
    additional_instructions?: string;
}

function normalizeSubscriptionRequestState(
    data: PaymentInstructions | SubscriptionRequestResponse | null
): SubscriptionRequestState {
    if (!data) {
        return {
            current_request: null,
            has_pending_request: false,
            pending_request: null,
            payment_options: undefined,
            additional_instructions: undefined,
        };
    }

    if ("current_request" in data || "has_pending_request" in data || "pending_request" in data) {
        const currentRequest = data.current_request ?? data.pending_request ?? null;
        const pendingRequest = data.pending_request ?? (currentRequest?.status === "pending" ? currentRequest : null);

        return {
            current_request: currentRequest,
            has_pending_request: data.has_pending_request ?? pendingRequest?.status === "pending",
            pending_request: pendingRequest,
            payment_options: data.payment_options ?? currentRequest?.payment_options,
            additional_instructions: data.additional_instructions,
        };
    }

    return {
        current_request: data,
        has_pending_request: data.status === "pending",
        pending_request: data.status === "pending" ? data : null,
        payment_options: data.payment_options,
        additional_instructions: data.instructions,
    };
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
    planId: string,
    paymentMethod: "telebirr" | "cbe",
    paymentReference: string
): Promise<PaymentInstructions> => {
    try {
        const response = await client.post<PaymentInstructions>(
            "/api/subscription/request/",
            {
                plan: planId,
                payment_method: paymentMethod,
                payment_reference: paymentReference,
            }
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

export const getSubscriptionRequest = async (): Promise<SubscriptionRequestState> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock subscription request state");
            return {
                ...normalizeSubscriptionRequestState(null),
                payment_options: mocks.MOCK_PAYMENT_INSTRUCTIONS.payment_options,
            };
        }
    }

    try {
        const response = await client.get<PaymentInstructions | SubscriptionRequestResponse>("/api/subscription/request/");
        return normalizeSubscriptionRequestState(response.data);
    } catch (err) {
        if (typeof err === "object" && err !== null && "status" in err && err.status === 404) {
            return normalizeSubscriptionRequestState(null);
        }

        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock pending subscription request");
            return {
                ...normalizeSubscriptionRequestState(null),
                payment_options: mocks.MOCK_PAYMENT_INSTRUCTIONS.payment_options,
            };
        }
        throw err;
    }
};
