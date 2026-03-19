import { Search, Sparkles } from "lucide-react";
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

type FilterType = "All" | "lecture_note" | "worksheet" | "past_exam" | "exit_exam";

const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: "All", label: "All" },
    { key: "lecture_note", label: "Notes" },
    { key: "worksheet", label: "Worksheets" },
    { key: "past_exam", label: "Past exams" },
    { key: "exit_exam", label: "Exit exams" },
];

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

export default function ResourcesScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const store = useContentStore();
    const { canAccessResource } = useAccess();

    const [view, setView] = useState<"select" | "list">(store.selectedCourse ? "list" : "select");
    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selDept, setSelDept] = useState<Department | null>(store.selectedDepartment);
    const [selYear, setSelYear] = useState<number | null>(store.selectedYear ?? student?.preferred_year ?? null);
    const [selSemester, setSelSemester] = useState<number | null>(store.selectedSemester ?? student?.preferred_semester ?? null);
    const [selCourse, setSelCourse] = useState<Course | null>(store.selectedCourse);
    const [filterType, setFilterType] = useState<FilterType>("All");
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
        if (!selDept || !selYear || !selSemester) return;

        setLoadingCourses(true);
        setCourses([]);
        setSelCourse(null);

        getCourses(selDept.id, selYear, selSemester)
            .then(setCourses)
            .catch(() => setError("Failed to load courses."))
            .finally(() => setLoadingCourses(false));
    }, [selDept?.id, selYear, selSemester]);

    const loadResources = useCallback(async (course: Course) => {
        setLoadingResources(true);
        setError(null);

        store.setSelectedDepartment(selDept);
        store.setSelectedYear(selYear);
        store.setSelectedSemester(selSemester);
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
    }, [selDept, selSemester, selYear, store]);

    const filteredResources = useMemo(() => {
        return store.resources.filter((resource) => {
            const matchesType = filterType === "All" || resource.file_type === filterType;
            const query = search.trim().toLowerCase();
            const matchesSearch = !query ||
                resource.title.toLowerCase().includes(query) ||
                resource.description?.toLowerCase().includes(query) ||
                resource.tags?.some((tag) => tag.toLowerCase().includes(query));

            return matchesType && matchesSearch;
        });
    }, [filterType, search, store.resources]);

    const resourceStats = useMemo(() => {
        const total = store.resources.length;
        const notes = store.resources.filter((item) => item.file_type === "lecture_note").length;
        const premium = store.resources.filter((item) => item.access_level === "premium").length;
        const recent = store.resources.filter((item) => isRecent(item.created_at)).length;
        return { total, notes, premium, recent };
    }, [store.resources]);

    const featuredResource = useMemo(() => {
        return [...store.resources].sort((a, b) => b.downloads_count - a.downloads_count)[0] ?? null;
    }, [store.resources]);

    if (view === "select") {
        return (
            <div className="app-screen">
                <div className="app-hero">
                    <div className="relative z-10">
                        <TopBackButton onClick={() => navigate("/home")} label="Home" />
                        <p className="app-section-label text-white/70">Resource library</p>
                        <h1 className="app-title mt-2 text-[2rem] font-bold text-white">Build your reading shelf</h1>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/72">
                            Select a department, year, semester, and course so the library stays tightly scoped and easier to browse.
                        </p>
                    </div>
                </div>

                <div className="app-scroll app-scroll-tight space-y-5">
                    <div className="app-panel rounded-[30px] p-5">
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
                        items={departments}
                        value={selDept?.id ?? null}
                        onSelect={(item) => setSelDept(item)}
                        getKey={(item) => item.id}
                        getLabel={(item) => item.name}
                        getMeta={(item) => item.code}
                    />

                    <div>
                        <p className="app-section-label mb-3">Year</p>
                        <div className="app-grid-2">
                            {YEARS.map((year) => (
                                <button
                                    key={year}
                                    onClick={() => setSelYear(year)}
                                    className={`app-panel rounded-[26px] p-4 text-left ${selYear === year ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                >
                                    <p className="app-title text-[1.8rem] font-bold text-[#18253D]">{year}</p>
                                    <p className="mt-1 text-sm text-[#53627D]">Year {year}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="app-section-label mb-3">Semester</p>
                        <div className="app-grid-2">
                            {SEMESTERS.map((semester) => (
                                <button
                                    key={semester}
                                    onClick={() => setSelSemester(semester)}
                                    className={`app-panel rounded-[26px] p-4 text-left ${selSemester === semester ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                >
                                    <p className="app-title text-[1.8rem] font-bold text-[#18253D]">{semester}</p>
                                    <p className="mt-1 text-sm text-[#53627D]">Semester {semester}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selDept && selYear && selSemester && (
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
                                            className="app-panel flex w-full items-center justify-between rounded-[28px] p-4 text-left transition-transform duration-200 active:scale-[0.985]"
                                        >
                                            <div>
                                                <p className="text-base font-semibold text-[#18253D]">{course.name}</p>
                                                <p className="mt-1 text-sm text-[#7F8CA5]">{course.code}</p>
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
                <div className="app-hero">
                    <div className="relative z-10">
                    <TopBackButton
                        onClick={() => {
                            setView("select");
                            setSelCourse(null);
                            store.setSelectedCourse(null);
                            store.setResources([]);
                        }}
                    />
                    <p className="app-section-label text-white/70">{selCourse?.code}</p>
                    <h1 className="app-title mt-2 text-[1.85rem] font-bold text-white">{selCourse?.name ?? "Resources"}</h1>
                </div>
            </div>

            <div className="app-scroll app-scroll-tight">
                <div className="app-grid-2">
                    <MetricCard label="Resources" value={resourceStats.total} tone="tone-blue" />
                    <MetricCard label="Fresh" value={resourceStats.recent} tone="tone-green" />
                    <MetricCard label="Notes" value={resourceStats.notes} tone="tone-gold" />
                    <MetricCard label="Premium" value={resourceStats.premium} tone="tone-purple" />
                </div>

                {featuredResource && (
                    <div className="mt-4 app-panel rounded-[30px] p-5">
                        <p className="app-section-label">Featured pack</p>
                        <div className="mt-3 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-base font-semibold text-[#18253D]">{featuredResource.title}</p>
                                <p className="mt-2 text-sm leading-relaxed text-[#53627D]">
                                    {featuredResource.description}
                                </p>
                            </div>
                            <div className="rounded-full bg-[#FFF6DF] px-3 py-2 text-xs font-bold text-[#B27614]">
                                {featuredResource.downloads_count} downloads
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 app-panel rounded-[30px] p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7F8CA5]" size={16} />
                        <input
                            type="text"
                            placeholder="Search title, tag, or description"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
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
                                        isLocked={!canAccessResource(resource.access_level)}
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
}: {
    label: string;
    loading: boolean;
    items: T[];
    value: number | null;
    onSelect: (item: T) => void;
    getKey: (item: T) => number;
    getLabel: (item: T) => string;
    getMeta: (item: T) => string;
}) {
    return (
        <div>
            <p className="app-section-label mb-3">{label}</p>
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-[28px]" />)}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <button
                            key={getKey(item)}
                            onClick={() => onSelect(item)}
                            className={`app-panel flex w-full items-center justify-between rounded-[28px] p-4 text-left ${value === getKey(item) ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                        >
                            <div>
                                <p className="text-base font-semibold text-[#18253D]">{getLabel(item)}</p>
                                <p className="mt-1 text-sm text-[#7F8CA5]">{getMeta(item)}</p>
                            </div>
                            <div className={`rounded-full px-3 py-2 text-xs font-bold ${value === getKey(item) ? "tone-blue" : "bg-[#F4F6FB] text-[#7F8CA5]"}`}>
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
