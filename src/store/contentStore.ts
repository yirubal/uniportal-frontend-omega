import { create } from "zustand";
import type { ProgramType } from "../utils/periods";

export interface Department {
    id: number;
    name: string;
    code: string;
}

export interface Course {
    id: number;
    name: string;
    code: string;
    department: number;
    program: ProgramType;
    year: number;
    period: number;
}

export type ResourceSource = "official" | "textbook" | "reference" | "notes" | "other";

export interface Resource {
    id: number;
    title: string;
    description?: string;
    file_type: "lecture_note" | "worksheet" | "past_exam" | "exit_exam";
    source?: ResourceSource | null;
    source_display?: string | null;
    access_level: "free" | "premium";
    status: "pending" | "published" | "rejected";
    course: number;
    downloads_count: number;
    created_at: string;
    is_locked: boolean;
    author?: string;
    pages?: number;
    file_size_mb?: number;
    estimated_minutes?: number;
    tags?: string[];
}

type FilterType = "All" | "lecture_note" | "worksheet" | "past_exam" | "exit_exam";

interface ContentState {
    // Selection
    selectedDepartment: Department | null;
    selectedProgram: ProgramType | null;
    selectedYear: number | null;
    selectedPeriod: number | null;
    selectedCourse: Course | null;

    // Data
    departments: Department[];
    courses: Course[];
    resources: Resource[];

    // UI state
    filterType: FilterType;
    searchQuery: string;
    isLoadingResources: boolean;

    // Actions
    setSelectedDepartment: (dept: Department | null) => void;
    setSelectedProgram: (program: ProgramType | null) => void;
    setSelectedYear: (year: number | null) => void;
    setSelectedPeriod: (period: number | null) => void;
    setSelectedCourse: (course: Course | null) => void;
    setDepartments: (departments: Department[]) => void;
    setCourses: (courses: Course[]) => void;
    setResources: (resources: Resource[]) => void;
    setFilterType: (type: FilterType) => void;
    setSearchQuery: (query: string) => void;
    setLoadingResources: (loading: boolean) => void;
    resetSelection: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
    selectedDepartment: null,
    selectedProgram: null,
    selectedYear: null,
    selectedPeriod: null,
    selectedCourse: null,
    departments: [],
    courses: [],
    resources: [],
    filterType: "All",
    searchQuery: "",
    isLoadingResources: false,

    setSelectedDepartment: (dept) => set({ selectedDepartment: dept }),
    setSelectedProgram: (program) => set({ selectedProgram: program }),
    setSelectedYear: (year) => set({ selectedYear: year }),
    setSelectedPeriod: (period) => set({ selectedPeriod: period }),
    setSelectedCourse: (course) => set({ selectedCourse: course }),
    setDepartments: (departments) => set({ departments }),
    setCourses: (courses) => set({ courses }),
    setResources: (resources) => set({ resources }),
    setFilterType: (filterType) => set({ filterType }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setLoadingResources: (loading) => set({ isLoadingResources: loading }),
    resetSelection: () =>
        set({
            selectedDepartment: null,
            selectedProgram: null,
            selectedYear: null,
            selectedPeriod: null,
            selectedCourse: null,
            courses: [],
            resources: [],
        }),
}));
