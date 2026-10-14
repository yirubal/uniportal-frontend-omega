import client from "./client";
import { withDevFallback, type ApiRequestOptions } from "./devFallback";
import {
    AttemptSummary,
    PracticeContentType,
    Question,
    QuizMode,
} from "../store/quizStore";
import type { ExitExamCategory } from "../utils/exitExams";
import { getPracticeContentMeta } from "../utils/practice";

export const getExamQuestions = async (
    examPaperId: number,
    mode: "practice" | "simulation" = "practice",
    options?: ApiRequestOptions
): Promise<Question[]> =>
    withDevFallback(
        "exam questions",
        async () => {
            const response = await client.get<Question[]>(
                `/api/exams/${examPaperId}/questions/`,
                { params: { mode }, signal: options?.signal }
            );
            return response.data;
        },
        (mocks) => mocks.getMockExamQuestions(examPaperId)
    );

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
    params?: ExamPapersParams,
    options?: ApiRequestOptions
): Promise<ExamPaper[]> =>
    withDevFallback(
        "exam papers",
        async () => {
            const response = await client.get<ExamPaper[]>("/api/exams/", { params, signal: options?.signal });
            return response.data;
        },
        (mocks) =>
            mocks.MOCK_EXAM_PAPERS.filter((exam) => {
                if (params?.type && exam.exam_type !== params.type) return false;
                if (params?.course && exam.course !== params.course) return false;
                if (params?.department) {
                    const course = mocks.MOCK_COURSES.find((item) => item.id === exam.course);
                    return course?.department === params.department;
                }
                return true;
            })
    );

export const getCourseQuizzes = async (
    courseId: number,
    options?: ApiRequestOptions
): Promise<ExamPaper[]> => {
    return getExamPapers({ type: "quiz", course: courseId }, options);
};

export const getCoursePracticePapers = async (
    courseId: number,
    practiceContentType: PracticeContentType,
    options?: ApiRequestOptions
): Promise<ExamPaper[]> => {
    return getExamPapers({
        type: getPracticeContentMeta(practiceContentType).apiExamType,
        course: courseId,
    }, options);
};

export const getExitExams = async (
    departmentId?: number,
    options?: ApiRequestOptions
): Promise<ExamPaper[]> => {
    const params = departmentId ? { department: departmentId } : undefined;
    const [officialExams, modelExams] = await Promise.all([
        getExamPapers({ ...params, type: "exit_real" }, options),
        getExamPapers({ ...params, type: "exit_model" }, options),
    ]);
    const exitExams = dedupeExamPapers([...officialExams, ...modelExams]);

    if (exitExams.length > 0) return exitExams;

    return getExamPapers({ ...params, type: "exit" }, options);
};

export const getExitExamTopics = async (
    departmentId: number,
    options?: ApiRequestOptions
): Promise<{ topic: string; count: number }[]> =>
    withDevFallback(
        "exit exam topics",
        async () => {
            const response = await client.get("/api/exit-exams/topics/", {
                params: { department: departmentId },
                signal: options?.signal,
            });
            return response.data;
        },
        (mocks) => mocks.getMockExitExamTopics(departmentId)
    );

export interface SubmitAttemptPayload {
    exam_paper?: number;
    answers: Record<string, string>;
    mode: QuizMode;
    questions?: Question[];
}

export type AttemptResponse = AttemptSummary;

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
    const score = asNumber(summary.score);
    const gradableTotal = asNumber(summary.gradable_total);

    return {
        ...summary,
        score,
        total: summary.total,
        percentage: asNumber(summary.percentage, gradableTotal > 0 ? (score / gradableTotal) * 100 : 0),
        gradable_total: gradableTotal,
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

    return withDevFallback(
        "attempt grading",
        async () => {
            const response = await client.post<AttemptResponse>(
                "/api/quiz/attempts/",
                requestPayload
            );
            return normalizeAttemptSummary(response.data);
        },
        (mocks) => {
            const questions = payload.exam_paper
                ? mocks.getMockExamQuestions(payload.exam_paper)
                : payload.questions ?? [];
            return normalizeAttemptSummary(mocks.evaluateMockAttempt(questions, requestPayload.answers, payload.mode));
        }
    );
};

export interface SelectivePracticeStartResponse {
    questions: Question[];
    filtered_count: number;
}

export interface SelectivePracticeChapter {
    id: number;
    number: number;
    title: string;
    description?: string;
    icon?: string;
    question_count: number;
    filter_value?: string;
}

interface SelectivePracticeChaptersResponse {
    chapters?: unknown;
    topics?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function toNumber(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toOptionalString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getFallbackChapterNumber(label: string, fallbackIndex: number) {
    const explicit = label.match(/\b(?:chapter|ch)\s*(\d+)\b/i)?.[1];
    const anyNumber = label.match(/\d+/)?.[0];
    return toNumber(explicit ?? anyNumber, fallbackIndex + 1);
}

function normalizeChapterList(data: unknown): SelectivePracticeChapter[] {
    if (!Array.isArray(data)) {
        const nested = asRecord(data);
        if (nested && "chapters" in nested) return normalizeChapterList(nested.chapters);
        if (nested && "topics" in nested) return normalizeChapterList(nested.topics);
        return [];
    }

    return data
        .map((item, index): SelectivePracticeChapter | null => {
            if (typeof item === "string") {
                const title = item.trim();
                if (!title) return null;
                const number = getFallbackChapterNumber(title, index);
                return {
                    id: number,
                    number,
                    title,
                    question_count: 0,
                    filter_value: title,
                };
            }

            const record = asRecord(item);
            if (!record) return null;

            const title = toOptionalString(record.title)
                ?? toOptionalString(record.name)
                ?? toOptionalString(record.chapter)
                ?? toOptionalString(record.topic)
                ?? "";
            if (!title) return null;

            const number = toNumber(record.number, getFallbackChapterNumber(title, index));
            return {
                id: toNumber(record.id, number),
                number,
                title,
                description: toOptionalString(record.description),
                icon: toOptionalString(record.icon),
                question_count: toNumber(record.question_count ?? record.count, 0),
                filter_value: toOptionalString(record.filter_value)
                    ?? toOptionalString(record.label)
                    ?? undefined,
            };
        })
        .filter((chapter): chapter is SelectivePracticeChapter => Boolean(chapter));
}

export const getSelectivePracticeChapters = async (
    courseId: number,
    options?: ApiRequestOptions
): Promise<SelectivePracticeChapter[]> =>
    withDevFallback(
        "selective practice chapters",
        async () => {
            const response = await client.get<SelectivePracticeChaptersResponse>(
                `/api/quiz/courses/${courseId}/chapters/`,
                { signal: options?.signal }
            );
            return normalizeChapterList(response.data?.chapters ?? response.data);
        },
        (mocks) => mocks.getMockSelectivePracticeChapters(courseId)
    );

export const startSelectivePractice = async (
    courseId: number,
    selectedTopics: string[],
    limit = 50
): Promise<SelectivePracticeStartResponse> =>
    withDevFallback(
        "selective practice questions",
        async () => {
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
        },
        (mocks) => {
            const questions = mocks.getMockSelectivePracticeQuestions(courseId, selectedTopics, limit);
            return { questions, filtered_count: questions.length };
        }
    );

export const getExitExamTopicQuestions = async (
    departmentId: number,
    topic: string,
    options?: ApiRequestOptions
): Promise<Question[]> =>
    withDevFallback(
        "exit exam topic questions",
        async () => {
            const response = await client.get<Question[]>("/api/exit-exams/topics/questions/", {
                params: { department: departmentId, topic },
                signal: options?.signal,
            });
            return response.data;
        },
        (mocks) => mocks.getMockExitExamTopicQuestions(departmentId, topic)
    );

export const getMyAttempts = async (options?: ApiRequestOptions) =>
    withDevFallback(
        "attempts",
        async () => {
            const response = await client.get("/api/quiz/attempts/", { signal: options?.signal });
            return response.data;
        },
        () => [
            { id: 1, score: 7, total: 10, mode: "practice", created_at: "2026-03-01T09:20:00Z" },
            { id: 2, score: 5, total: 6, mode: "simulation", created_at: "2026-03-10T14:10:00Z" },
        ]
    );

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

export const getMyPerformance = async (options?: ApiRequestOptions): Promise<Performance> =>
    withDevFallback(
        "performance",
        async () => {
            const response = await client.get<RawPerformance>(
                "/api/students/me/performance/",
                { signal: options?.signal }
            );
            return normalizePerformance(response.data);
        },
        (mocks) => normalizePerformance(mocks.MOCK_PERFORMANCE)
    );

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

function isSubscriptionRequestResponse(
    data: PaymentInstructions | SubscriptionRequestResponse
): data is SubscriptionRequestResponse {
    return "current_request" in data || "has_pending_request" in data || "pending_request" in data;
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

    if (isSubscriptionRequestResponse(data)) {
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

export const getPlans = async (options?: ApiRequestOptions): Promise<Plan[]> =>
    withDevFallback(
        "plans",
        async () => {
            const response = await client.get<Plan[]>("/api/subscription/plans/", {
                skipGlobalLoader: options?.skipGlobalLoader,
                skipAuthClear: options?.skipAuthClear,
                signal: options?.signal,
            });
            return response.data;
        },
        (mocks) => mocks.MOCK_PLANS
    );

export const requestSubscription = async (
    planId: string,
    paymentMethod: "telebirr" | "cbe",
    paymentReference: string
): Promise<PaymentInstructions> =>
    withDevFallback(
        "subscription instructions",
        async () => {
            const response = await client.post<PaymentInstructions>(
                "/api/subscription/request/",
                {
                    plan: planId,
                    payment_method: paymentMethod,
                    payment_reference: paymentReference,
                }
            );
            return response.data;
        },
        (mocks) => ({
            ...mocks.MOCK_PAYMENT_INSTRUCTIONS,
            reference: `${mocks.MOCK_PAYMENT_INSTRUCTIONS.reference}-${planId.toUpperCase()}`,
        })
    );

export const getSubscriptionRequest = async (options?: ApiRequestOptions): Promise<SubscriptionRequestState> =>
    withDevFallback(
        "subscription request state",
        async () => {
            try {
                const response = await client.get<PaymentInstructions | SubscriptionRequestResponse>("/api/subscription/request/", {
                    skipGlobalLoader: options?.skipGlobalLoader,
                    skipAuthClear: options?.skipAuthClear,
                    signal: options?.signal,
                });
                return normalizeSubscriptionRequestState(response.data);
            } catch (err) {
                // No request has been made yet.
                if (typeof err === "object" && err !== null && "status" in err && err.status === 404) {
                    return normalizeSubscriptionRequestState(null);
                }
                throw err;
            }
        },
        (mocks) => ({
            ...normalizeSubscriptionRequestState(null),
            payment_options: mocks.MOCK_PAYMENT_INSTRUCTIONS.payment_options,
        })
    );
