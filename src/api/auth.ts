import client from "./client";
import { Student, StudentPreferences } from "../store/authStore";

interface BackendStudent {
    id?: number;
    telegram_id: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    is_premium?: boolean;
    subscription_status?: "free" | "premium";
    subscription_expiry?: string | null;
    preferences?: Record<string, unknown> | null;
    preferred_department?: number | null;
    preferred_year?: number | null;
    preferred_semester?: number | null;
}

interface LoginResponse {
    token: string;
    student: Student;
}

function readPreference(
    preferences: Record<string, unknown> | null | undefined,
    key: "department" | "year" | "semester"
): number | null {
    const aliases: Record<typeof key, string[]> = {
        department: ["department", "preferred_department"],
        year: ["year", "preferred_year"],
        semester: ["semester", "preferred_semester"],
    };

    for (const alias of aliases[key]) {
        const raw = preferences?.[alias];
        if (typeof raw === "number") return raw;
        if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
    }

    return null;
}

function buildPreferences(student: BackendStudent): StudentPreferences {
    return {
        department:
            readPreference(student.preferences, "department") ??
            student.preferred_department ??
            null,
        year:
            readPreference(student.preferences, "year") ??
            student.preferred_year ??
            null,
        semester:
            readPreference(student.preferences, "semester") ??
            student.preferred_semester ??
            null,
    };
}

export function normalizeStudent(student: BackendStudent): Student {
    const preferences = buildPreferences(student);
    const fullName = student.name?.trim() ||
        [student.first_name, student.last_name].filter(Boolean).join(" ").trim() ||
        "Student";
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = student.first_name?.trim() || nameParts[0] || "Student";
    const lastName = student.last_name?.trim() || nameParts.slice(1).join(" ");

    return {
        id: student.id,
        telegram_id: student.telegram_id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        username: student.username ?? "",
        preferred_department: preferences.department,
        preferred_year: preferences.year,
        preferred_semester: preferences.semester,
        onboarding_complete: Boolean(
            preferences.department && preferences.year && preferences.semester
        ),
        is_premium: student.is_premium ?? student.subscription_status === "premium",
        subscription_expiry: student.subscription_expiry ?? null,
        preferences,
    };
}

export const loginWithTelegram = async (
    initData: string
): Promise<LoginResponse> => {
    const response = await client.post<{ token: string; student: BackendStudent }>("/api/auth/telegram/", {
        init_data: initData,
    });
    return {
        token: response.data.token,
        student: normalizeStudent(response.data.student),
    };
};

export const getMyProfile = async (): Promise<Student> => {
    const response = await client.get<BackendStudent>("/api/students/me/");
    return normalizeStudent(response.data);
};

export const updateMyProfile = async (data: {
    preferred_department?: number;
    preferred_year?: number;
    preferred_semester?: number;
    onboarding_complete?: boolean;
}): Promise<Student> => {
    const response = await client.patch<BackendStudent>("/api/students/me/", {
        preferences: {
            ...(typeof data.preferred_department === "number"
                ? { department: data.preferred_department }
                : {}),
            ...(typeof data.preferred_year === "number"
                ? { year: data.preferred_year }
                : {}),
            ...(typeof data.preferred_semester === "number"
                ? { semester: data.preferred_semester }
                : {}),
        },
    });
    return normalizeStudent(response.data);
};

export const getWatermarkText = async (): Promise<string> => {
    const response = await client.get<{ watermark: string }>(
        "/api/students/me/watermark/"
    );
    return response.data.watermark;
};
