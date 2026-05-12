import client from "./client";
import type { ActiveTermResponse, ExamScheduleResponse } from "../types/exams";

const isDev = import.meta.env.DEV;
const forceDevMocks = import.meta.env.VITE_FORCE_DEV_MOCKS === "true";

async function getMocks() {
    if (!isDev) return null;
    return import("./devMocks");
}

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

export const fetchActiveTerm = async (): Promise<ActiveTermResponse> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock active term");
            return mocks.MOCK_ACTIVE_TERM;
        }
    }

    try {
        const response = await client.get<ActiveTermResponse>("/api/exams/active-term/", {
            params: { _ts: Date.now() },
        });

        return normalizeActiveTerm(response.data);
    } catch (error) {
        throw error;
    }
};

export const lookupExamSchedule = async (
    query: string
): Promise<ExamScheduleResponse> => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
        throw new Error("Enter your Student ID or full name.");
    }

    const isId = /^\d+$/.test(trimmedQuery);
    const params = isId
        ? { student_id: trimmedQuery, _ts: Date.now() }
        : { name: trimmedQuery, _ts: Date.now() };

    const getMockSchedule = async () => {
        const mocks = await getMocks();
        const match = mocks?.MOCK_EXAM_SCHEDULES.find((schedule) => {
            if (isId) return schedule.student_id === trimmedQuery;
            return schedule.student_name.toLowerCase().includes(trimmedQuery.toLowerCase());
        });

        if (match) {
            return match;
        }

        throw {
            message: "No exam found. Check your ID or name spelling.",
        };
    };

    if (forceDevMocks) {
        console.info("[dev] Force using mock exam schedule");
        return getMockSchedule();
    }

    try {
        const response = await client.get<ExamScheduleResponse>("/api/exams/lookup/", {
            params,
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};
