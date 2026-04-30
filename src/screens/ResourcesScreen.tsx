import { Check, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCourses, getDepartments, getResources } from "../api/content";
import ResourceCard from "../components/ResourceCard";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useAccess } from "../hooks/useAccess";
import { useAuthStore } from "../store/authStore";
import { useContentStore } from "../store/contentStore";
import type { Course, Department } from "../store/contentStore";
import { getPeriodLabel, getPeriodOptions, getProgramLabel, PROGRAM_OPTIONS, type ProgramType, YEAR_OPTIONS } from "../utils/periods";

type FilterType = "All" | "lecture_note" | "worksheet" | "past_exam" | "exit_exam";
const INTERACTIVE_RESOURCE_TYPES = new Set<FilterType>(["past_exam", "exit_exam"]);

const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: "All", label: "All" },
    { key: "lecture_note", label: "Notes" },
    { key: "worksheet", label: "Worksheets" },
];

export default function ResourcesScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const store = useContentStore();
    const { canAccessResource } = useAccess();

    const [view, setView] = useState<"select" | "list">("select");
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selDept, setSelDept] = useState<Department | null>(store.selectedDepartment);
    const [selProgram, setSelProgram] = useState<ProgramType | null>(store.selectedProgram ?? student?.preferred_program ?? null);
    const [selYear, setSelYear] = useState<number | null>(store.selectedYear ?? student?.preferred_year ?? null);
    const [selPeriod, setSelPeriod] = useState<number | null>(store.selectedPeriod ?? student?.preferred_period ?? null);
    const [selCourse, setSelCourse] = useState<Course | null>(null);
    const [filterType, setFilterType] = useState<FilterType>("All");
    const [departmentSearch, setDepartmentSearch] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        getDepartments()
            .then((items) => {
                setDepartments(items);
                if (!selDept && student?.preferred_department) {
                    const preferred = items.find((item) => item.id === student.preferred_department);
                    if (preferred) setSelDept(preferred);
                }
            })
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepts(false));
    }, [selDept, student?.preferred_department]);

    useEffect(() => {
        const validPeriods = getPeriodOptions(selProgram).map((item) => item.value);
        if (selPeriod && !validPeriods.includes(selPeriod)) {
            setSelPeriod(null);
        }
    }, [selPeriod, selProgram]);

    useEffect(() => {
        if (!selDept || !selProgram || !selYear || !selPeriod) return;

        setLoadingCourses(true);
        setCourses([]);
        setSelCourse(null);

        getCourses(selDept.id, selProgram, selYear, selPeriod)
            .then(setCourses)
            .catch(() => setError("Failed to load courses."))
            .finally(() => setLoadingCourses(false));
    }, [selDept?.id, selProgram, selYear, selPeriod]);

    const loadResources = useCallback(async (course: Course) => {
        setLoadingResources(true);
        setError(null);

        store.setSelectedDepartment(selDept);
        store.setSelectedProgram(selProgram);
        store.setSelectedYear(selYear);
        store.setSelectedPeriod(selPeriod);
        store.setSelectedCourse(course);

        try {
            const resources = await getResources(course.id);
            store.setResources(resources);
            setView("list");
        } catch {
            setError("Failed to load resources.");
        } finally {
            setLoadingResources(false);
        }
    }, [selDept, selPeriod, selProgram, selYear, store]);

    const visibleResources = useMemo(() => {
        return store.resources.filter((resource) => !INTERACTIVE_RESOURCE_TYPES.has(resource.file_type as FilterType));
    }, [store.resources]);

    const filteredResources = useMemo(() => {
        return visibleResources.filter((resource) => {
            const matchesType = filterType === "All" || resource.file_type === filterType;
            const query = search.trim().toLowerCase();
            const matchesSearch = !query ||
                resource.title.toLowerCase().includes(query) ||
                resource.description?.toLowerCase().includes(query) ||
                resource.tags?.some((tag) => tag.toLowerCase().includes(query));

            return matchesType && matchesSearch;
        });
    }, [filterType, search, visibleResources]);

    const resourceStats = useMemo(() => {
        const total = visibleResources.length;
        const notes = visibleResources.filter((item) => item.file_type === "lecture_note").length;
        const premium = visibleResources.filter((item) => item.access_level === "premium").length;
        const recent = visibleResources.filter((item) => isRecent(item.created_at)).length;
        return { total, notes, premium, recent };
    }, [visibleResources]);

    const featuredResource = useMemo(() => {
        return [...visibleResources].sort((a, b) => b.downloads_count - a.downloads_count)[0] ?? null;
    }, [visibleResources]);

    const filteredDepartments = useMemo(() => {
        const query = departmentSearch.trim().toLowerCase();
        if (!query) return departments;

        return departments.filter((department) =>
            department.name.toLowerCase().includes(query) ||
            department.code.toLowerCase().includes(query)
        );
    }, [departmentSearch, departments]);

    if (view === "select") {
        return (
            <div className="app-screen">
                <div className="app-topbar">
                    <div className="relative z-10">
                        <TopBackButton onClick={() => navigate("/home")} label="Home" />
                        <p className="app-section-label">Resource library</p>
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#18253D]">Choose a course shelf</h1>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#53627D]">
                            Start with department, program, year, period, and course so the library stays compact and useful.
                        </p>
                    </div>
                </div>

                <div className="app-scroll app-scroll-compact space-y-5">
                    <div className="app-sheet p-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-[18px] bg-[#EDF2FF] p-3 text-[#2D5BFF]">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <p className="app-section-label">Smart start</p>
                                <p className="mt-2 text-base font-semibold text-[#18253D]">Start with the right course context</p>
                                <p className="mt-1 text-sm leading-relaxed text-[#53627D]">
                                    This keeps management case notes, accounting worksheets, and future computing resources separated cleanly.
                                </p>
                            </div>
                        </div>
                    </div>

                    <SelectorGroup
                        label="Department"
                        loading={loadingDepts}
                        items={filteredDepartments}
                        value={selDept?.id ?? null}
                        onSelect={(item) => setSelDept(item)}
                        getKey={(item) => item.id}
                        getLabel={(item) => item.name}
                        getMeta={(item) => item.code}
                        searchValue={departmentSearch}
                        onSearchChange={setDepartmentSearch}
                        searchPlaceholder="Search departments by name"
                    />

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="app-section-label">Program</p>
                            {selProgram && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF6DF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#B27614]">
                                    <Check size={12} />
                                    {getProgramLabel(selProgram)}
                                </span>
                            )}
                        </div>
                        <div className="mb-5 flex gap-2">
                            {PROGRAM_OPTIONS.map((program) => (
                                <button
                                    key={program.value}
                                    onClick={() => setSelProgram(program.value)}
                                    className={`app-sheet flex min-h-[5rem] flex-1 items-center justify-center rounded-[20px] px-4 py-3 text-center ${selProgram === program.value ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                >
                                    <p className="text-sm font-bold text-[#18253D]">{program.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="app-section-label">Year</p>
                            {selYear && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF2FF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#2D5BFF]">
                                    <Check size={12} />
                                    Year {selYear}
                                </span>
                            )}
                        </div>
                        <div className="app-grid-2">
                            {YEAR_OPTIONS.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setSelYear(year)}
                                    className={`app-sheet flex min-h-[6.5rem] flex-col items-center justify-center rounded-[20px] px-4 py-3 text-center ${selYear === year ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                >
                                    <p className="app-title text-[1.8rem] font-bold text-[#18253D]">{year}</p>
                                    <p className="mt-1 text-sm text-[#53627D]">
                                        {selYear === year ? "Selected" : `Year ${year}`}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="app-section-label">Period</p>
                            {selPeriod && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF8F1] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#2E9E73]">
                                    <Check size={12} />
                                    {getPeriodLabel(selPeriod, selProgram)}
                                </span>
                            )}
                        </div>
                        <div className="app-grid-2">
                            {getPeriodOptions(selProgram).map((period) => (
                                <button
                                    key={period.value}
                                    onClick={() => setSelPeriod(period.value)}
                                    className={`app-sheet flex min-h-[6.5rem] flex-col items-center justify-center rounded-[20px] px-4 py-3 text-center ${selPeriod === period.value ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                >
                                    <p className="app-title text-[1.3rem] font-bold text-[#18253D]">{period.label}</p>
                                    <p className="mt-1 text-sm text-[#53627D]">
                                        {selPeriod === period.value ? "Selected" : period.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selDept && selProgram && selYear && selPeriod && (
                        <div>
                            <p className="app-section-label mb-3">Course</p>
                            {loadingCourses ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-[28px]" />)}
                                </div>
                            ) : courses.length === 0 ? (
                                <EmptyState
                                    title="No courses found"
                                    description="No courses match the selected filters."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {courses.map((course) => (
                                        <button
                                            key={course.id}
                                            onClick={() => {
                                                setSelCourse(course);
                                                void loadResources(course);
                                            }}
                                            style={{ paddingInline: "1.25rem" }}
                                            className="app-panel flex min-h-[5rem] w-full items-center justify-between gap-3 overflow-hidden rounded-[16px] px-5 py-3 text-left transition-transform duration-200 active:scale-[0.985]"
                                        >
                                            <div className="min-w-0 flex-1 pr-3">
                                                <p className="text-base font-semibold text-[#18253D]">{course.name}</p>
                                                <p className="mt-1 text-sm text-[#7F8CA5]">
                                                    {course.code} · {getProgramLabel(selProgram)} · {getPeriodLabel(selPeriod, selProgram)}
                                                </p>
                                            </div>
                                            <div className="rounded-full bg-[#18253D] px-3 py-2 text-xs font-bold text-white">
                                                Open
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {error && <p className="text-center text-sm text-[#D95A50]">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => {
                            setView("select");
                            setSelCourse(null);
                            store.setSelectedCourse(null);
                            store.setResources([]);
                        }}
                    />
                    <p className="app-section-label">{selCourse?.code}</p>
                    <h1 className="app-title mt-2 text-[1.55rem] font-bold text-[#18253D]">{selCourse?.name ?? "Resources"}</h1>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-grid-2">
                    <MetricCard label="Resources" value={resourceStats.total} tone="tone-blue" />
                    <MetricCard label="Fresh" value={resourceStats.recent} tone="tone-green" />
                    <MetricCard label="Notes" value={resourceStats.notes} tone="tone-gold" />
                    <MetricCard label="Premium" value={resourceStats.premium} tone="tone-purple" />
                </div>

                {featuredResource && (
                    <div className="mt-4 app-sheet p-5">
                        <p className="app-section-label">Featured pack</p>
                        <div className="mt-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-base font-semibold text-[#18253D]">{featuredResource.title}</p>
                                <p className="mt-2 text-sm leading-relaxed text-[#53627D]">
                                    {featuredResource.description}
                                </p>
                            </div>
                            <div className="flex min-h-[4.5rem] min-w-[5.5rem] flex-col items-center justify-start self-start rounded-[20px] bg-[#FFF6DF] px-3.5 py-2.5 text-[#B27614]">
                                <span className="w-full text-center text-base font-black leading-none">{featuredResource.downloads_count}</span>
                                <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">Downloads</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 app-sheet p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7F8CA5]" size={16} />
                        <input
                            type="text"
                            placeholder="Search title, tag, or description"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            style={{ paddingInlineStart: "2.85rem" }}
                            className="app-input pl-10"
                        />
                    </div>

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterType(tab.key)}
                                className={`app-chip whitespace-nowrap ${filterType === tab.key ? "app-chip-active" : ""}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4">
                    {loadingResources ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-[28px]" />)}
                        </div>
                    ) : error ? (
                        <ErrorState
                            message={error}
                            onRetry={() => {
                                if (selCourse) void loadResources(selCourse);
                            }}
                        />
                    ) : filteredResources.length === 0 ? (
                        <EmptyState
                            title="No resources found"
                            description={search ? "Try a different search term or clear the filters." : "There are no resources for this category yet."}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filteredResources.map((resource) => (
                                <div key={resource.id}>
                                    <ResourceCard
                                        resource={resource}
                                        isLocked={resource.is_locked || !canAccessResource(resource.access_level)}
                                    />
                                    {!!resource.tags?.length && (
                                        <div className="ml-2 mt-2 flex flex-wrap gap-2">
                                            {resource.tags.slice(0, 3).map((tag) => (
                                                <span key={`${resource.id}-${tag}`} className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[11px] font-semibold text-[#4D6691]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SelectorGroup<T>({
    label,
    loading,
    items,
    value,
    onSelect,
    getKey,
    getLabel,
    getMeta,
    searchValue,
    onSearchChange,
    searchPlaceholder,
}: {
    label: string;
    loading: boolean;
    items: T[];
    value: number | null;
    onSelect: (item: T) => void;
    getKey: (item: T) => number;
    getLabel: (item: T) => string;
    getMeta: (item: T) => string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
}) {
    return (
        <div>
            <p className="app-section-label mb-3">{label}</p>
            {onSearchChange && (
                <div className="mb-3 app-sheet p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7F8CA5]" size={16} />
                        <input
                            type="text"
                            placeholder={searchPlaceholder ?? "Search"}
                            value={searchValue ?? ""}
                            onChange={(event) => onSearchChange(event.target.value)}
                            style={{ paddingInlineStart: "2.85rem" }}
                            className="app-input pl-10"
                        />
                    </div>
                </div>
            )}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-[28px]" />)}
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    title="No departments found"
                    description="Try a different search term to find your department."
                />
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <button
                            key={getKey(item)}
                            onClick={() => onSelect(item)}
                            style={{ paddingInline: "1.25rem" }}
                            className={`app-panel flex min-h-[5rem] w-full items-center justify-between gap-3 overflow-hidden rounded-[16px] px-5 py-3 text-left ${value === getKey(item) ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                        >
                            <div className="min-w-0 flex-1 pr-3">
                                <p className="text-base font-semibold leading-snug text-[#18253D]">{getLabel(item)}</p>
                                <p className="mt-1 text-sm text-[#7F8CA5]">{getMeta(item)}</p>
                            </div>
                            <div className={`flex-shrink-0 self-center rounded-full px-3 py-2 text-xs font-bold ${value === getKey(item) ? "tone-blue" : "bg-[#F4F6FB] text-[#7F8CA5]"}`}>
                                {value === getKey(item) ? "Selected" : "Choose"}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className={`app-stat-card rounded-[24px] ${tone}`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</p>
        </div>
    );
}

function isRecent(dateString: string) {
    const createdAt = new Date(dateString).getTime();
    return Date.now() - createdAt < 1000 * 60 * 60 * 24 * 7;
}
