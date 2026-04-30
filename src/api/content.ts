import client from "./client";
import { Department, Course, Resource } from "../store/contentStore";
import type { ProgramType } from "../utils/periods";

const isDev = import.meta.env.DEV;
const forceDevMocks = import.meta.env.VITE_FORCE_DEV_MOCKS === "true";

// Lazily import mocks only in dev (tree-shaken out of production build)
async function getMocks() {
    if (!isDev) return null;
    return import("./devMocks");
}

// ── Departments ──────────────────────────────────────────────

export const getDepartments = async (): Promise<Department[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock departments");
            return mocks.MOCK_DEPARTMENTS;
        }
    }

    try {
        const response = await client.get<Department[]>("/api/departments/");
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock departments");
            return mocks.MOCK_DEPARTMENTS;
        }
        throw err;
    }
};

// ── Courses ───────────────────────────────────────────────────

export const getCourses = async (
    departmentId: number,
    program: ProgramType,
    year: number,
    period: number
): Promise<Course[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock courses");
            return mocks.MOCK_COURSES.filter(
                (c) =>
                    c.department === departmentId &&
                    c.program === program &&
                    c.year === year &&
                    c.period === period
            );
        }
    }

    try {
        const response = await client.get<Array<{
            id: number;
            course: {
                id: number;
                name: string;
                code: string;
                description?: string;
            };
            year: number;
            period: number;
            program: ProgramType;
        }>>(
            `/api/departments/${departmentId}/courses/`,
            { params: { program, year, period } }
        );
        return response.data.map((item) => ({
            id: item.course.id,
            name: item.course.name,
            code: item.course.code,
            department: departmentId,
            program: item.program,
            year: item.year,
            period: item.period,
        }));
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock courses");
            return mocks.MOCK_COURSES.filter(
                (c) =>
                    c.department === departmentId &&
                    c.program === program &&
                    c.year === year &&
                    c.period === period
            );
        }
        throw err;
    }
};

// ── Resources ─────────────────────────────────────────────────

export interface ResourcesParams {
    type?: string;
    search?: string;
}

export const getResources = async (
    courseId: number,
    params?: ResourcesParams
): Promise<Resource[]> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force using mock resources");
            let resources = mocks.MOCK_RESOURCES.filter((r) => r.course === courseId);
            if (params?.type && params.type !== "All") {
                resources = resources.filter((r) => r.file_type === params.type);
            }
            if (params?.search) {
                const q = params.search.toLowerCase();
                resources = resources.filter((r) => r.title.toLowerCase().includes(q));
            }
            return resources;
        }
    }

    try {
        const response = await client.get<Resource[]>(
            `/api/courses/${courseId}/resources/`,
            { params }
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Using mock resources");
            let resources = mocks.MOCK_RESOURCES.filter((r) => r.course === courseId);
            if (params?.type && params.type !== "All") {
                resources = resources.filter((r) => r.file_type === params.type);
            }
            if (params?.search) {
                const q = params.search.toLowerCase();
                resources = resources.filter((r) => r.title.toLowerCase().includes(q));
            }
            return resources;
        }
        throw err;
    }
};

export const getResourceDetail = async (
    resourceId: number
): Promise<Resource> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            const r = mocks.MOCK_RESOURCES.find((r) => r.id === resourceId);
            if (r) return r;
        }
    }

    try {
        const response = await client.get<Resource>(
            `/api/resources/${resourceId}/`
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            const r = mocks.MOCK_RESOURCES.find((r) => r.id === resourceId);
            if (r) return r;
        }
        throw err;
    }
};

export interface DownloadResponse {
    url: string;
    filename: string;
    expires_in: number;
    watermark?: string;
}

export const requestDownload = async (
    resourceId: number,
    watermark?: string
): Promise<DownloadResponse> => {
    if (forceDevMocks) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Force mock download response");
            return { url: "#", filename: `resource_${resourceId}.pdf`, expires_in: 300, watermark };
        }
    }

    try {
        const response = await client.post<DownloadResponse>(
            `/api/resources/${resourceId}/download/`,
            watermark ? { watermark } : undefined
        );
        return response.data;
    } catch (err) {
        const mocks = await getMocks();
        if (mocks) {
            console.info("[dev] Mock download response");
            return { url: "#", filename: `resource_${resourceId}.pdf`, expires_in: 300, watermark };
        }
        throw err;
    }
};
