/**
 * devMocks.ts — Realistic stub data for browser development.
 *
 * This file is ONLY used when Vite is running in dev mode AND the API
 * request fails (e.g. the Django backend is not running).
 * It is never bundled into the production build.
 */

import { Department, Course, Resource } from "../store/contentStore";
import { Student } from "../store/authStore";

// ── Departments ────────────────────────────────────────────────────────────────

export const MOCK_DEPARTMENTS: Department[] = [
    { id: 1, name: "Computer Science & Engineering", code: "CSE" },
    { id: 2, name: "Electrical & Computer Engineering", code: "ECE" },
    { id: 3, name: "Civil & Environmental Engineering", code: "CEE" },
    { id: 4, name: "Mechanical Engineering", code: "ME" },
    { id: 5, name: "Business Administration", code: "BA" },
    { id: 6, name: "Accounting & Finance", code: "AF" },
    { id: 7, name: "Law", code: "LAW" },
    { id: 8, name: "Architecture", code: "ARCH" },
];

// ── Courses ────────────────────────────────────────────────────────────────────

export const MOCK_COURSES: Course[] = [
    { id: 1, name: "Data Structures & Algorithms", code: "CS301", department: 1, year: 2, semester: 1 },
    { id: 2, name: "Operating Systems", code: "CS402", department: 1, year: 3, semester: 1 },
    { id: 3, name: "Database Systems", code: "CS305", department: 1, year: 2, semester: 2 },
    { id: 4, name: "Computer Networks", code: "CS410", department: 1, year: 3, semester: 2 },
    { id: 5, name: "Software Engineering", code: "CS450", department: 1, year: 4, semester: 1 },
    { id: 6, name: "Artificial Intelligence", code: "CS460", department: 1, year: 4, semester: 2 },
];

// ── Resources ─────────────────────────────────────────────────────────────────

export const MOCK_RESOURCES: Resource[] = [
    {
        id: 1,
        title: "DSA - Full Lecture Notes",
        file_type: "lecture_note",
        access_level: "free",
        status: "published",
        course: 1,
        downloads_count: 142,
        created_at: "2024-09-01T10:00:00Z",
        is_locked: false,
    },
    {
        id: 2,
        title: "2023 Exit Exam Past Paper",
        file_type: "past_exam",
        access_level: "premium",
        status: "published",
        course: 1,
        downloads_count: 87,
        created_at: "2024-08-20T10:00:00Z",
        is_locked: true,
    },
    {
        id: 3,
        title: "Operating Systems - Ch1 Slides",
        file_type: "lecture_note",
        access_level: "free",
        status: "published",
        course: 2,
        downloads_count: 63,
        created_at: "2024-10-05T10:00:00Z",
        is_locked: false,
    },
];

// ── Student ────────────────────────────────────────────────────────────────────

export const MOCK_STUDENT: Student = {
    id: 1,
    telegram_id: 123456789,
    first_name: "Dev",
    last_name: "User",
    username: "devuser",
    preferred_department: 1,
    preferred_year: 2,
    preferred_semester: 1,
    onboarding_complete: true,
    subscription_status: "free",
    subscription_expiry: null,
    downloads_today: 1,
};

// ── Helper ─────────────────────────────────────────────────────────────────────

/** Wraps a value in a fake Axios-shaped response after a short delay. */
export function mockResponse<T>(data: T, delayMs = 400): Promise<{ data: T }> {
    return new Promise((resolve) =>
        setTimeout(() => resolve({ data }), delayMs)
    );
}
