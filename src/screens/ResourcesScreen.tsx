import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { useContentStore } from "../store/contentStore";
import { useAccess } from "../hooks/useAccess";
import { getDepartments, getCourses, getResources } from "../api/content";
import { Department, Course, Resource } from "../store/contentStore";
import ResourceCard from "../components/ResourceCard";
import { Skeleton, EmptyState, ErrorState } from "../components/ui";
import { formatFileType } from "../utils/format";

type FilterType = "All" | "lecture_note" | "worksheet" | "past_exam" | "exit_exam";

const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: "All", label: "All" },
    { key: "lecture_note", label: "Notes" },
    { key: "worksheet", label: "Worksheets" },
    { key: "past_exam", label: "Past Exams" },
];

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

type ViewState = "select" | "list";

export default function ResourcesScreen() {
    const { student } = useAuthStore();
    const store = useContentStore();
    const { canAccessResource } = useAccess();

    // Local state for selection phase
    const [view, setView] = useState<ViewState>(
        store.selectedCourse ? "list" : "select"
    );
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);
    const [localCourses, setLocalCourses] = useState<Course[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Selections (seed from student prefs or store)
    const [selDept, setSelDept] = useState<Department | null>(store.selectedDepartment);
    const [selYear, setSelYear] = useState<number | null>(store.selectedYear ?? student?.preferred_year ?? null);
    const [selSemester, setSelSemester] = useState<number | null>(store.selectedSemester ?? student?.preferred_semester ?? null);
    const [selCourse, setSelCourse] = useState<Course | null>(store.selectedCourse);

    const [filterType, setFilterType] = useState<FilterType>("All");
    const [search, setSearch] = useState("");

    // Load departments once
    useEffect(() => {
        getDepartments()
            .then((depts) => {
                setDepartments(depts);
                // Pre-select student's preferred dept if none chosen
                if (!selDept && student?.preferred_department) {
                    const preferred = depts.find(
                        (d) => d.id === student.preferred_department
                    );
                    if (preferred) setSelDept(preferred);
                }
            })
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepts(false));
    }, []);

    // Load courses whenever dept/year/semester changes
    useEffect(() => {
        if (!selDept || !selYear || !selSemester) return;
        setLoadingCourses(true);
        setSelCourse(null);
        setLocalCourses([]);
        getCourses(selDept.id, selYear, selSemester)
            .then(setLocalCourses)
            .catch(() => setError("Failed to load courses."))
            .finally(() => setLoadingCourses(false));
    }, [selDept?.id, selYear, selSemester]);

    // Load resources when course selected
    const loadResources = useCallback((course: Course) => {
        setLoadingResources(true);
        setError(null);
        store.setSelectedCourse(course);
        store.setSelectedDepartment(selDept);
        store.setSelectedYear(selYear);
        store.setSelectedSemester(selSemester);

        getResources(course.id)
            .then(store.setResources)
            .catch(() => setError("Failed to load resources."))
            .finally(() => setLoadingResources(false));
    }, [selDept, selYear, selSemester]);

    const handleCourseSelect = (course: Course) => {
        setSelCourse(course);
        loadResources(course);
        setView("list");
    };

    const handleBack = () => {
        setView("select");
        setSelCourse(null);
        store.setSelectedCourse(null);
        store.setResources([]);
    };

    // Filtered resources
    const filtered = store.resources.filter((r) => {
        const matchType = filterType === "All" || r.file_type === filterType;
        const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    // ── SELECTION VIEW ─────────────────────────────────────────────────────────
    if (view === "select") {
        return (
            <div className="fixed inset-0 flex flex-col bg-[#F5F7FA]">
                {/* Header */}
                <div className="bg-[#0A1628] px-5 pt-12 pb-5">
                    <h1 className="text-white text-xl font-bold">Resources</h1>
                    <p className="text-[#8899AA] text-sm mt-0.5">
                        Choose your course to get started
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 pb-28">
                    {/* Department */}
                    <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-2">
                        Department
                    </p>
                    {loadingDepts ? (
                        <div className="space-y-2 mb-5">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 mb-5">
                            {departments.map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => setSelDept(d)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-150 active:scale-95 ${
                                        selDept?.id === d.id
                                            ? "bg-[#0A1628] border-[#0A1628] text-white"
                                            : "bg-white border-[#E0E0E0] text-[#555]"
                                    }`}
                                >
                                    {d.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Year */}
                    <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-2">
                        Year
                    </p>
                    <div className="flex gap-2 mb-5">
                        {YEARS.map((y) => (
                            <button
                                key={y}
                                onClick={() => setSelYear(y)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-150 active:scale-95 ${
                                    selYear === y
                                        ? "bg-[#0A1628] border-[#0A1628] text-white"
                                        : "bg-white border-[#E0E0E0] text-[#555]"
                                }`}
                            >
                                {y}
                            </button>
                        ))}
                    </div>

                    {/* Semester */}
                    <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-2">
                        Semester
                    </p>
                    <div className="flex gap-2 mb-5">
                        {SEMESTERS.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSelSemester(s)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-150 active:scale-95 ${
                                    selSemester === s
                                        ? "bg-[#0A1628] border-[#0A1628] text-white"
                                        : "bg-white border-[#E0E0E0] text-[#555]"
                                }`}
                            >
                                Sem {s}
                            </button>
                        ))}
                    </div>

                    {/* Courses */}
                    {selDept && selYear && selSemester && (
                        <>
                            <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-2">
                                Course
                            </p>
                            {loadingCourses ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
                                </div>
                            ) : localCourses.length === 0 ? (
                                <EmptyState
                                    icon="📭"
                                    title="No courses found"
                                    description="No courses match the selected filters."
                                />
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {localCourses.map((course) => (
                                        <button
                                            key={course.id}
                                            onClick={() => handleCourseSelect(course)}
                                            className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform text-left"
                                        >
                                            <div>
                                                <p className="text-[#0A1628] text-sm font-semibold leading-snug">
                                                    {course.name}
                                                </p>
                                                <p className="text-[#999] text-xs mt-0.5">{course.code}</p>
                                            </div>
                                            <span className="w-8 h-8 rounded-lg bg-[#0A1628] flex items-center justify-center text-[#FFB400] text-base font-bold flex-shrink-0">
                                                ›
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    {error && <p className="text-[#F44336] text-sm text-center mt-4">{error}</p>}
                </div>
            </div>
        );
    }

    // ── LIST VIEW ──────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 flex flex-col bg-[#F5F7FA]">
            {/* Header */}
            <div className="bg-[#0A1628] px-5 pt-12 pb-4">
                <button onClick={handleBack} className="flex items-center gap-1 text-[#8899AA] text-sm mb-2 active:opacity-70">
                    ← Back
                </button>
                <h1 className="text-white text-lg font-bold leading-tight">
                    {selCourse?.name ?? "Resources"}
                </h1>
                <p className="text-[#8899AA] text-xs mt-0.5">{selCourse?.code}</p>
            </div>

            {/* Filter tabs + Search */}
            <div className="bg-white border-b border-[#EAEAEA] px-5 pt-3 pb-0">
                <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-[#F5F7FA] rounded-xl text-sm text-[#0A1628] placeholder-[#BBBBBB] outline-none border border-transparent focus:border-[#0A1628]/20"
                    />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-3 no-scrollbar">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterType(tab.key)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex-shrink-0 ${
                                filterType === tab.key
                                    ? "bg-[#0A1628] text-[#FFB400]"
                                    : "bg-[#F5F7FA] text-[#555]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resources */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-28">
                {loadingResources ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={() => selCourse && loadResources(selCourse)} />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="📭"
                        title="No resources found"
                        description={search ? "Try a different search term." : "No resources available for this filter."}
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map((resource) => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                isLocked={!canAccessResource(resource.access_level)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
