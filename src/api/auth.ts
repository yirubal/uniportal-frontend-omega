import client from "./client";
import { Student, StudentPreferences } from "../store/authStore";
import type { ProgramType } from "../utils/periods";

const isDev = import.meta.env.DEV;
const forceDevMocks = import.meta.env.VITE_FORCE_DEV_MOCKS === "true";
const DEV_STUDENT_STORAGE_KEY = "uniportal-dev-student";

type TelegramWindow = Window & {
    Telegram?: {
        WebApp?: {
            initData?: string;
            ready?: () => void;
        };
    };
};

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
    onboarding_complete?: boolean;
    preferences?: Record<string, unknown> | null;
    preferred_department?: number | null;
    preferred_program?: ProgramType | null;
    preferred_year?: number | null;
    preferred_period?: number | null;
}

interface LoginResponse {
    token: string;
    student: Student;
}

export class MissingTelegramInitDataError extends Error {
    constructor() {
        super("Telegram initData is required.");
        this.name = "MissingTelegramInitDataError";
    }
}

export function isMissingTelegramInitDataError(error: unknown) {
    return error instanceof MissingTelegramInitDataError;
}

export class ChannelRequiredError extends Error {
    channelUrl: string;
    constructor(channelUrl: string) {
        super("You must join the official channel before using this app.");
        this.name = "ChannelRequiredError";
        this.channelUrl = channelUrl;
    }
}

export function isChannelRequiredError(error: unknown): error is ChannelRequiredError {
    return error instanceof ChannelRequiredError;
}

function getTelegramWebApp() {
    if (typeof window === "undefined") return undefined;
    return (window as TelegramWindow).Telegram?.WebApp;
}

async function getMockStudent(): Promise<Student | null> {
    if (!isDev || !forceDevMocks) return null;

    const storedStudent = window.localStorage.getItem(DEV_STUDENT_STORAGE_KEY);
    if (storedStudent) {
        try {
            const student = makeFreeDevStudent(JSON.parse(storedStudent) as Student);
            window.localStorage.setItem(DEV_STUDENT_STORAGE_KEY, JSON.stringify(student));
            return student;
        } catch {
            window.localStorage.removeItem(DEV_STUDENT_STORAGE_KEY);
        }
    }

    const { MOCK_STUDENT } = await import("./devMocks");
    const student = makeFreeDevStudent(MOCK_STUDENT);
    window.localStorage.setItem(DEV_STUDENT_STORAGE_KEY, JSON.stringify(student));
    return student;
}

function makeFreeDevStudent(student: Student): Student {
    return {
        ...student,
        is_premium: false,
        subscription_expiry: null,
    };
}

function saveMockStudent(student: Student) {
    if (!isDev || (!forceDevMocks && !isLocalDevHost)) return;
    window.localStorage.setItem(DEV_STUDENT_STORAGE_KEY, JSON.stringify(makeFreeDevStudent(student)));
}

function readPreference(
    preferences: Record<string, unknown> | null | undefined,
    key: "department" | "program" | "year" | "period"
): number | null {
    if (key === "program") {
        return null;
    }

    const aliases: Record<typeof key, string[]> = {
        department: ["department", "preferred_department"],
        program: ["program", "preferred_program"],
        year: ["year", "preferred_year"],
        period: ["period", "preferred_period", "semester", "preferred_semester"],
    };

    for (const alias of aliases[key]) {
        const raw = preferences?.[alias];
        if (typeof raw === "number") return raw;
        if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
    }

    return null;
}

function readProgramPreference(
    preferences: Record<string, unknown> | null | undefined,
    fallback: ProgramType | null | undefined
): ProgramType | null {
    const aliases = ["program", "preferred_program"];

    for (const alias of aliases) {
        const raw = preferences?.[alias];
        if (raw === "regular" || raw === "extension" || raw === "distance") {
            return raw;
        }
    }

    if (fallback === "regular" || fallback === "extension" || fallback === "distance") {
        return fallback;
    }

    return null;
}

function buildPreferences(student: BackendStudent): StudentPreferences {
    return {
        department:
            readPreference(student.preferences, "department") ??
            student.preferred_department ??
            null,
        program:
            readProgramPreference(student.preferences, student.preferred_program) ??
            null,
        year:
            readPreference(student.preferences, "year") ??
            student.preferred_year ??
            null,
        period:
            readPreference(student.preferences, "period") ??
            student.preferred_period ??
            null,
    };
}

function hasActiveSubscriptionExpiry(subscriptionExpiry: string | null | undefined): boolean {
    if (!subscriptionExpiry) return false;

    const expiryTime = new Date(subscriptionExpiry).getTime();
    return Number.isFinite(expiryTime) && expiryTime > Date.now();
}

export function normalizeStudent(student: BackendStudent): Student {
    const preferences = buildPreferences(student);
    const fullName = student.name?.trim() ||
        [student.first_name, student.last_name].filter(Boolean).join(" ").trim() ||
        "Student";
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = student.first_name?.trim() || nameParts[0] || "Student";
    const lastName = student.last_name?.trim() || nameParts.slice(1).join(" ");
    const hasActiveExpiry = hasActiveSubscriptionExpiry(student.subscription_expiry);
    const isPremium =
        student.subscription_status !== undefined
            ? student.subscription_status === "premium" && hasActiveExpiry
            : Boolean(student.is_premium && hasActiveExpiry);

    return {
        id: student.id,
        telegram_id: student.telegram_id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        username: student.username ?? "",
        preferred_department: preferences.department,
        preferred_program: preferences.program,
        preferred_year: preferences.year,
        preferred_period: preferences.period,
        onboarding_complete: student.onboarding_complete ?? Boolean(
            preferences.department && preferences.program && preferences.year && preferences.period
        ),
        is_premium: isPremium,
        subscription_expiry: student.subscription_expiry ?? null,
        preferences,
    };
}

export const loginWithTelegram = async (): Promise<LoginResponse> => {
    const webApp = getTelegramWebApp();
    webApp?.ready?.();
    const initData = webApp?.initData;

    console.info("initData exists:", Boolean(initData));
    console.info("initData length:", initData?.length ?? 0);
    console.info("initData preview:", initData?.substring(0, 100) ?? "");

    if (!initData) {
        console.error("initData is empty - app may not be running inside Telegram");
        throw new MissingTelegramInitDataError();
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/telegram/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            init_data: initData,
        }),
    });

    if (!response.ok) {
        if (response.status === 403) {
            try {
                const errBody = await response.json() as { error?: string; channel_url?: string };
                if (errBody.error === "CHANNEL_REQUIRED" && errBody.channel_url) {
                    throw new ChannelRequiredError(errBody.channel_url);
                }
            } catch (e) {
                if (e instanceof ChannelRequiredError) throw e;
            }
        }
        throw {
            status: response.status,
            message: "Authentication failed. Please try again.",
            upgrade_required: false,
        };
    }

    const data = await response.json() as { token: string; student: BackendStudent };

    return {
        token: data.token,
        student: normalizeStudent(data.student),
    };
};

export const loginWithDevMode = async (): Promise<LoginResponse> => {
    const response = await client.post<{ token: string; student: BackendStudent }>("/api/auth/telegram/", {
        dev_mode: true,
        telegram_id: 999999,
        first_name: "Test",
        username: "testuser",
    });
    return {
        token: response.data.token,
        student: normalizeStudent(response.data.student),
    };
};

export const getMyProfile = async (): Promise<Student> => {
    const mockStudent = await getMockStudent();
    if (mockStudent) {
        console.info("[dev] Using mock student profile");
        return mockStudent;
    }

    const response = await client.get<BackendStudent>("/api/students/me/");
    return normalizeStudent(response.data);
};

export const updateMyProfile = async (data: {
    preferred_department?: number;
    preferred_program?: ProgramType;
    preferred_year?: number;
    preferred_period?: number;
    onboarding_complete?: boolean;
}): Promise<Student> => {
    const mockStudent = await getMockStudent();
    if (mockStudent) {
        const updatedStudent: Student = {
            ...mockStudent,
            preferred_department:
                typeof data.preferred_department === "number"
                    ? data.preferred_department
                    : mockStudent.preferred_department,
            preferred_program:
                data.preferred_program ?? mockStudent.preferred_program,
            preferred_year:
                typeof data.preferred_year === "number"
                    ? data.preferred_year
                    : mockStudent.preferred_year,
            preferred_period:
                typeof data.preferred_period === "number"
                    ? data.preferred_period
                    : mockStudent.preferred_period,
            onboarding_complete:
                typeof data.onboarding_complete === "boolean"
                    ? data.onboarding_complete
                    : mockStudent.onboarding_complete,
            preferences: {
                department:
                    typeof data.preferred_department === "number"
                        ? data.preferred_department
                        : mockStudent.preferences.department,
                program:
                    data.preferred_program ?? mockStudent.preferences.program,
                year:
                    typeof data.preferred_year === "number"
                        ? data.preferred_year
                        : mockStudent.preferences.year,
                period:
                    typeof data.preferred_period === "number"
                        ? data.preferred_period
                        : mockStudent.preferences.period,
            },
        };
        saveMockStudent(updatedStudent);
        console.info("[dev] Updated mock student profile");
        return updatedStudent;
    }

    const response = await client.patch<BackendStudent>("/api/students/me/", {
        ...(typeof data.preferred_department === "number"
            ? { preferred_department: data.preferred_department }
            : {}),
        ...(data.preferred_program
            ? { preferred_program: data.preferred_program }
            : {}),
        ...(typeof data.preferred_year === "number"
            ? { preferred_year: data.preferred_year }
            : {}),
        ...(typeof data.preferred_period === "number"
            ? { preferred_period: data.preferred_period }
            : {}),
        ...(typeof data.onboarding_complete === "boolean"
            ? { onboarding_complete: data.onboarding_complete }
            : {}),
    });
    return normalizeStudent(response.data);
};

export const getWatermarkText = async (): Promise<string> => {
    const response = await client.get<{ watermark: string }>(
        "/api/students/me/watermark/"
    );
    return response.data.watermark;
};
