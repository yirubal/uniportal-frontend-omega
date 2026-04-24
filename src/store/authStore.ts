import { create } from "zustand";

export interface StudentPreferences {
    department: number | null;
    year: number | null;
    semester: number | null;
}

export interface Student {
    id?: number;
    telegram_id: number;
    name: string;
    first_name: string;
    last_name: string;
    username: string;
    preferred_department: number | null;
    preferred_year: number | null;
    preferred_semester: number | null;
    onboarding_complete: boolean;
    is_premium: boolean;
    subscription_expiry: string | null;
    preferences: StudentPreferences;
}

interface AuthState {
    token: string | null;
    student: Student | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    setAuth: (token: string, student: Student) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    student: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    setAuth: (token, student) =>
        set({ token, student, isAuthenticated: true, isLoading: false, error: null }),

    setLoading: (loading) =>
        set({ isLoading: loading }),

    setError: (error) =>
        set({ error, isLoading: false }),

    clearAuth: () =>
        set({ token: null, student: null, isAuthenticated: false, isLoading: false, error: null }),
}));
