import client from "./client";
import { Department, Course, Resource } from "../store/contentStore";

// ── Departments ──────────────────────────────────────────────

export const getDepartments = async (): Promise<Department[]> => {
    const response = await client.get<Department[]>("/api/departments/");
    return response.data;
};

// ── Courses ───────────────────────────────────────────────────

export const getCourses = async (
    departmentId: number,
    year: number,
    semester: number
): Promise<Course[]> => {
    const response = await client.get<Course[]>(
        `/api/departments/${departmentId}/courses/`,
        { params: { year, semester } }
    );
    return response.data;
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
    const response = await client.get<Resource[]>(
        `/api/courses/${courseId}/resources/`,
        { params }
    );
    return response.data;
};

export const getResourceDetail = async (
    resourceId: number
): Promise<Resource> => {
    const response = await client.get<Resource>(
        `/api/resources/${resourceId}/`
    );
    return response.data;
};

export interface DownloadResponse {
    url: string;
    filename: string;
    expires_in: number;
}

export const requestDownload = async (
    resourceId: number
): Promise<DownloadResponse> => {
    const response = await client.post<DownloadResponse>(
        `/api/resources/${resourceId}/download/`
    );
    return response.data;
};