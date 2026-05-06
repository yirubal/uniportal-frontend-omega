import { create } from "zustand";
import type { ProgramType } from "../utils/periods";

export interface StudentPreferences {
    department: number | null;
    program: ProgramType | null;
    year: number | null;
    period: number | null;
}

export interface Student {
    id?: number;
    telegram_id: number;
    name: string;
    first_name: string;
    last_name: string;
    username: string;
    preferred_department: number | null;
    preferred_program: ProgramType | null;
    preferred_year: number | null;
    preferred_period: number | null;
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
    channelRequired: boolean;
    channelUrl: string | null;

    setAuth: (token: string, student: Student) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setChannelRequired: (channelUrl: string) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    student: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    channelRequired: false,
    channelUrl: null,

    setAuth: (token, student) =>
        set({ token, student, isAuthenticated: true, isLoading: false, error: null, channelRequired: false, channelUrl: null }),

    setLoading: (loading) =>
        set({ isLoading: loading }),

    setError: (error) =>
        set({ error, isLoading: false }),

    setChannelRequired: (channelUrl) =>
        set({ channelRequired: true, channelUrl, isLoading: false, error: null }),

    clearAuth: () =>
        set({ token: null, student: null, isAuthenticated: false, isLoading: false, error: null, channelRequired: false, channelUrl: null }),
}));
