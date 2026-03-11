import { create } from "zustand";

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
    year: number;
    semester: number;
}

export interface Resource {
    id: number;
    title: string;
    file_type: "lecture_note" | "worksheet" | "past_exam" | "exit_exam";
    access_level: "free" | "premium";
    status: "pending" | "published" | "rejected";
    course: number;
    downloads_count: number;
    created_at: string;
    is_locked: boolean;
}

type FilterType = "All" | "lecture_note" | "worksheet" | "past_exam" | "exit_exam";

interface ContentState {
    // Selection
    selectedDepartment: Department | null;
    selectedYear: number | null;
    selectedSemester: number | null;
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
    setSelectedYear: (year: number | null) => void;
    setSelectedSemester: (semester: number | null) => void;
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
    selectedYear: null,
    selectedSemester: null,
    selectedCourse: null,
    departments: [],
    courses: [],
    resources: [],
    filterType: "All",
    searchQuery: "",
    isLoadingResources: false,

    setSelectedDepartment: (dept) => set({ selectedDepartment: dept }),
    setSelectedYear: (year) => set({ selectedYear: year }),
    setSelectedSemester: (semester) => set({ selectedSemester: semester }),
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
            selectedYear: null,
            selectedSemester: null,
            selectedCourse: null,
            courses: [],
            resources: [],
        }),
}));