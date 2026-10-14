import client from "./client";
import { withDevFallback, type ApiRequestOptions } from "./devFallback";
import type { ActiveTermResponse, ExamScheduleResponse } from "../types/exams";

function normalizeActiveTerm(data: unknown): ActiveTermResponse {
    const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const nestedTerm = record.term && typeof record.term === "object" ? record.term as Record<string, unknown> : null;
    const source = nestedTerm ?? record;
    const activeValue = record.active ?? record.is_active ?? Boolean(nestedTerm);

    return {
        active: activeValue === true,
        year: typeof source.year === "number" ? source.year : undefined,
        term: typeof source.term === "number" ? source.term : undefined,
        center: typeof source.center === "string" ? source.center : undefined,
    };
}

export const fetchActiveTerm = async (options?: ApiRequestOptions): Promise<ActiveTermResponse> =>
    withDevFallback(
        "active term",
        async () => {
            const response = await client.get<ActiveTermResponse>("/api/exams/active-term/", {
                params: { _ts: Date.now() },
                skipGlobalLoader: options?.skipGlobalLoader,
                skipAuthClear: options?.skipAuthClear,
                signal: options?.signal,
            });

            return normalizeActiveTerm(response.data);
        },
        (mocks) => mocks.MOCK_ACTIVE_TERM
    );

export const lookupExamSchedule = async (
    query: string,
    options?: ApiRequestOptions
): Promise<ExamScheduleResponse> => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
        throw new Error("Enter your Student ID or full name.");
    }

    const isId = /^\d+$/.test(trimmedQuery);

    return withDevFallback(
        "exam schedule",
        async () => {
            const response = await client.get<ExamScheduleResponse>("/api/exams/lookup/", {
                params: { query: trimmedQuery, _ts: Date.now() },
                signal: options?.signal,
            });

            return response.data;
        },
        (mocks) => {
            const match = mocks.MOCK_EXAM_SCHEDULES.find((schedule) => {
                if (isId) return schedule.student_id === trimmedQuery;
                return schedule.student_name.toLowerCase().includes(trimmedQuery.toLowerCase());
            });

            if (match) return match;

            throw {
                message: "No exam found. Check your ID or name spelling.",
            };
        }
    );
};
