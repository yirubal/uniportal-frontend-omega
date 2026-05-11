import client from "./client";
import type { ActiveTermResponse, ExamScheduleResponse } from "../types/exams";

const isDev = import.meta.env.DEV;
const forceDevMocks = import.meta.env.VITE_FORCE_DEV_MOCKS === "true";

const NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
};

async function getMocks() {
    if (!isDev) return null;
    return import("./devMocks");
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
            headers: NO_CACHE_HEADERS,
            params: { _ts: Date.now() },
        });

        return response.data;
    } catch (error) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock active term");
            return mocks.MOCK_ACTIVE_TERM;
        }
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
            headers: NO_CACHE_HEADERS,
            params,
        });

        return response.data;
    } catch (error) {
        if (isDev) {
            return getMockSchedule();
        }
        throw error;
    }
};
