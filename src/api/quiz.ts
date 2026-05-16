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

interface ApiRequestOptions {
    skipGlobalLoader?: boolean;
    skipAuthClear?: boolean;
}

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
    questions?: Question[];
}

export interface AttemptResponse extends AttemptSummary {}

type RawTopicScore = number | { percentage?: number; correct?: number; total?: number };

function asNumber(value: unknown, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeTopicScore(score: RawTopicScore) {
    if (typeof score === "number") return score;
    if (typeof score?.percentage === "number") return score.percentage;
    if (typeof score?.correct === "number" && typeof score?.total === "number" && score.total > 0) {
        return Math.round((score.correct / score.total) * 100);
    }
    return 0;
}

function normalizeAttemptSummary(summary: AttemptResponse): AttemptResponse {
    return {
        ...summary,
        score: asNumber(summary.score),
        total: summary.total,
        percentage: asNumber(summary.percentage, summary.gradable_total ? (summary.score / summary.gradable_total) * 100 : 0),
        gradable_total: asNumber(summary.gradable_total),
        pending_count: asNumber(summary.pending_count),
        topic_breakdown: Object.fromEntries(
            Object.entries(summary.topic_breakdown ?? {}).map(([topic, score]) => [
                topic,
                normalizeTopicScore(score as RawTopicScore),
            ])
        ),
        weak_topics: Array.isArray(summary.weak_topics) ? summary.weak_topics : [],
        detailed_answers: summary.detailed_answers && typeof summary.detailed_answers === "object"
            ? summary.detailed_answers
            : undefined,
    };
}

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
                : payload.questions ?? [];
            return normalizeAttemptSummary(mocks.evaluateMockAttempt(questions, requestPayload.answers, payload.mode));
        }
    }

    try {
        const response = await client.post<AttemptResponse>(
            "/api/quiz/attempts/",
            requestPayload
        );
        return normalizeAttemptSummary(response.data);
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Evaluating mock attempt");
            const questions = payload.exam_paper
                ? mocks.getMockExamQuestions(payload.exam_paper)
                : payload.questions ?? [];
            return normalizeAttemptSummary(mocks.evaluateMockAttempt(questions, requestPayload.answers, payload.mode));
        }
        throw err;
    }
};

export interface SelectivePracticeStartResponse {
    questions: Question[];
    filtered_count: number;
}

function normalizeTopicList(data: unknown): string[] {
    if (Array.isArray(data)) {
        return data
            .map((item) => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object" && "topic" in item) return String(item.topic);
                if (item && typeof item === "object" && "chapter" in item) return String(item.chapter);
                if (item && typeof item === "object" && "name" in item) return String(item.name);
                if (item && typeof item === "object" && "title" in item) return String(item.title);
                return "";
            })
            .filter(Boolean);
    }

    if (data && typeof data === "object" && "topics" in data) {
        return normalizeTopicList((data as { topics: unknown }).topics);
    }

    return [];
}

export const getSelectivePracticeTopics = async (
    courseId: number
): Promise<string[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock selective practice topics");
            return mocks.getMockSelectivePracticeTopics(courseId);
        }
    }

    try {
        const response = await client.get("/api/quiz/courses/" + courseId + "/topics/");
        return normalizeTopicList(response.data);
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock selective practice topics");
            return mocks.getMockSelectivePracticeTopics(courseId);
        }
        throw err;
    }
};

export const startSelectivePractice = async (
    courseId: number,
    selectedTopics: string[],
    limit = 50
): Promise<SelectivePracticeStartResponse> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock selective practice questions");
            const questions = mocks.getMockSelectivePracticeQuestions(courseId, selectedTopics, limit);
            return { questions, filtered_count: questions.length };
        }
    }

    try {
        const response = await client.post<SelectivePracticeStartResponse>(
            "/api/quiz/selective-practice/",
            {
                course_id: courseId,
                selected_topics: selectedTopics,
                limit,
            }
        );
        return {
            questions: Array.isArray(response.data.questions) ? response.data.questions : [],
            filtered_count: Number(response.data.filtered_count ?? response.data.questions?.length ?? 0),
        };
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock selective practice questions");
            const questions = mocks.getMockSelectivePracticeQuestions(courseId, selectedTopics, limit);
            return { questions, filtered_count: questions.length };
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
        paper_id?: number;
        exam_type?: ExamPaper["exam_type"];
        course_name: string;
        attempts: number;
        average: number;
    }[];
}

type RawPerformance = Partial<Performance> & {
    attempts_by_paper?: {
        id?: number;
        paper_id?: number;
        exam_paper_id?: number;
        paper_title?: string;
        exam_type?: ExamPaper["exam_type"];
        attempts?: number;
        average?: number;
    }[];
};

function normalizePerformance(performance: RawPerformance): Performance {
    const attemptsByCourse = Array.isArray(performance.attempts_by_course)
        ? performance.attempts_by_course
        : (performance.attempts_by_paper ?? []).map((paper) => ({
            paper_id: paper.paper_id ?? paper.exam_paper_id ?? paper.id,
            exam_type: paper.exam_type,
            course_name: paper.paper_title ?? formatExamTypeLabel(paper.exam_type) ?? "Exam paper",
            attempts: asNumber(paper.attempts),
            average: asNumber(paper.average),
        }));

    return {
        total_attempts: asNumber(performance.total_attempts),
        average_score: asNumber(performance.average_score),
        best_score: asNumber(performance.best_score),
        weak_topics: Array.isArray(performance.weak_topics) ? performance.weak_topics : [],
        score_over_time: Array.isArray(performance.score_over_time)
            ? performance.score_over_time.map((point) => ({
                date: point.date,
                score: asNumber(point.score),
            }))
            : [],
        attempts_by_course: attemptsByCourse,
    };
}

function formatExamTypeLabel(type?: string) {
    const labels: Record<string, string> = {
        quiz: "Quiz",
        final: "Past exam",
        exit_real: "Past years exit exam",
        exit_model: "Exit exam model",
        exit: "Exit exam",
    };

    return type ? labels[type] : undefined;
}

export const getMyPerformance = async (): Promise<Performance> => {
    if (forceDevMocks || (isDev && isLocalDevHost)) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock performance");
            return normalizePerformance(mocks.MOCK_PERFORMANCE);
        }
    }

    try {
        const response = await client.get<RawPerformance>(
            "/api/students/me/performance/"
        );
        return normalizePerformance(response.data);
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock performance");
            return normalizePerformance(mocks.MOCK_PERFORMANCE);
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

export const getPlans = async (options?: ApiRequestOptions): Promise<Plan[]> => {
    try {
        const response = await client.get<Plan[]>("/api/subscription/plans/", {
            skipGlobalLoader: options?.skipGlobalLoader,
            skipAuthClear: options?.skipAuthClear,
        });
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

export const getSubscriptionRequest = async (options?: ApiRequestOptions): Promise<SubscriptionRequestState> => {
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
        const response = await client.get<PaymentInstructions | SubscriptionRequestResponse>("/api/subscription/request/", {
            skipGlobalLoader: options?.skipGlobalLoader,
            skipAuthClear: options?.skipAuthClear,
        });
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
