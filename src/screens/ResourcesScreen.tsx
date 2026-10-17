import { Check, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getResources } from "../api/content";
import ResourceShelf from "../components/resources/ResourceShelf";
import SelectorGroup from "../components/SelectorGroup";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, SkeletonList } from "../components/ui";
import { useCourseFilter } from "../hooks/useCourseFilter";
import { useStudentProfile } from "../hooks/useStudentProfile";
import { useContentStore } from "../store/contentStore";
import type { Course } from "../store/contentStore";
import { getPeriodLabel, getPeriodOptions, getProgramLabel, PROGRAM_OPTIONS, YEAR_OPTIONS } from "../utils/periods";

export default function ResourcesScreen() {
    const navigate = useNavigate();
    const profile = useStudentProfile();
    // The saved picker values are read once for initial state (the shelf subscribes to the resource list).
    const savedPicker = useContentStore.getState();

    const [view, setView] = useState<"select" | "list">("select");
    const [customizingProfile, setCustomizingProfile] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selCourse, setSelCourse] = useState<Course | null>(null);
    const [departmentSearch, setDepartmentSearch] = useState("");
    const useTailoredStart = profile.hasCompleteProfile && !customizingProfile;
    const filter = useCourseFilter({
        tailored: useTailoredStart,
        // Custom mode starts from the last browsed shelf, falling back to the saved profile.
        initial: {
            departmentId: savedPicker.selectedDepartment?.id ?? profile.departmentId,
            program: profile.program ?? savedPicker.selectedProgram,
            year: profile.year ?? savedPicker.selectedYear,
            period: profile.period ?? savedPicker.selectedPeriod,
        },
    });
    const {
        departments,
        department: selDept,
        program: selProgram,
        year: selYear,
        period: selPeriod,
        setDepartment: setSelDept,
        setProgram: setSelProgram,
        setYear: setSelYear,
        setPeriod: setSelPeriod,
        courses,
        isComplete: canLoadCourseShelf,
        departmentsError,
        reloadDepartments: loadDepartments,
        departmentMissing: tailoredDepartmentMissing,
    } = filter;
    const loadingDepts = filter.departmentsLoading;
    const loadingCourses = filter.coursesLoading;
    const selectedDepartmentName = selDept?.name ?? "Your department";

    const resourcesRequestRef = useRef<AbortController | null>(null);

    useEffect(() => () => resourcesRequestRef.current?.abort(), []);

    const loadResources = useCallback(async (course: Course) => {
        const content = useContentStore.getState();
        // Tapping a second course cancels the first request so its resources can't replace the newer ones.
        resourcesRequestRef.current?.abort();
        const controller = new AbortController();
        resourcesRequestRef.current = controller;

        setLoadingResources(true);
        setError(null);

        content.setSelectedDepartment(selDept);
        content.setSelectedProgram(selProgram);
        content.setSelectedYear(selYear);
        content.setSelectedPeriod(selPeriod);
        content.setSelectedCourse(course);

        try {
            const resources = await getResources(course.id, undefined, { signal: controller.signal });
            if (controller.signal.aborted) return;
            content.setResources(resources);
            setView("list");
        } catch {
            if (!controller.signal.aborted) setError("Failed to load resources.");
        } finally {
            if (!controller.signal.aborted) setLoadingResources(false);
        }
    }, [selDept, selPeriod, selProgram, selYear]);

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
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-ink">
                            {useTailoredStart ? "Your course shelf" : "Choose a course shelf"}
                        </h1>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
                            {useTailoredStart
                                ? "Resources are loaded from the profile you saved during setup."
                                : "Start with department, program, year, period, and course so the library stays compact and useful."}
                        </p>
                    </div>
                </div>

                <div className="app-scroll app-scroll-compact space-y-5">
                    <div className="app-sheet p-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-[18px] bg-accent-soft p-3 text-accent">
                                <Sparkles size={18} />
                            </div>
                            <div>
                                <p className="app-section-label">
                                    {useTailoredStart ? "Saved profile" : "Smart start"}
                                </p>
                                <p className="mt-2 text-base font-semibold text-ink">
                                    {useTailoredStart ? selectedDepartmentName : "Start with the right course context"}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-subtle">
                                    {useTailoredStart
                                        ? profile.profileLabel
                                        : "This keeps management case notes, accounting worksheets, and future computing resources separated cleanly."}
                                </p>
                            </div>
                        </div>
                        {useTailoredStart && (
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCustomizingProfile(true)}
                                    className="flex-1 rounded-full border border-line-strong bg-card/85 px-3.5 py-2 text-xs font-bold text-ink"
                                >
                                    Change filters
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/onboarding")}
                                    className="flex-1 rounded-full bg-accent-soft px-3.5 py-2 text-xs font-bold text-accent-deep"
                                >
                                    Edit profile
                                </button>
                            </div>
                        )}
                    </div>

                    {!useTailoredStart && (
                        <>
                            {departmentsError && (
                                <ErrorState message="Failed to load departments." onRetry={loadDepartments} />
                            )}
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
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-gold-ink">
                                            <Check size={12} />
                                            {getProgramLabel(selProgram)}
                                        </span>
                                    )}
                                </div>
                                <div className="mb-5 flex gap-2">
                                    {PROGRAM_OPTIONS.map((program) => (
                                        <button
                                            type="button"
                                            key={program.value}
                                            onClick={() => setSelProgram(program.value)}
                                            className={`app-sheet flex min-h-[5rem] flex-1 items-center justify-center rounded-[20px] px-4 py-3 text-center ${selProgram === program.value ? "ring-2 ring-accent/20" : ""}`}
                                        >
                                            <p className="text-sm font-bold text-ink">{program.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <p className="app-section-label">Year</p>
                                    {selYear && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-accent">
                                            <Check size={12} />
                                            Year {selYear}
                                        </span>
                                    )}
                                </div>
                                <div className="app-grid-2">
                                    {YEAR_OPTIONS.map((year) => (
                                        <button
                                            type="button"
                                            key={year}
                                            onClick={() => setSelYear(year)}
                                            className={`app-sheet flex min-h-[6.5rem] flex-col items-center justify-center rounded-[20px] px-4 py-3 text-center ${selYear === year ? "ring-2 ring-accent/20" : ""}`}
                                        >
                                            <p className="app-title text-[1.8rem] font-bold text-ink">{year}</p>
                                            <p className="mt-1 text-sm text-subtle">
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
                                        <span className="inline-flex items-center gap-1 rounded-full bg-success-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-success-ink">
                                            <Check size={12} />
                                            {getPeriodLabel(selPeriod, selProgram)}
                                        </span>
                                    )}
                                </div>
                                <div className="app-grid-2">
                                    {getPeriodOptions(selProgram).map((period) => (
                                        <button
                                            type="button"
                                            key={period.value}
                                            onClick={() => setSelPeriod(period.value)}
                                            className={`app-sheet flex min-h-[6.5rem] flex-col items-center justify-center rounded-[20px] px-4 py-3 text-center ${selPeriod === period.value ? "ring-2 ring-accent/20" : ""}`}
                                        >
                                            <p className="app-title text-[1.3rem] font-bold text-ink">{period.label}</p>
                                            <p className="mt-1 text-sm text-subtle">
                                                {selPeriod === period.value ? "Selected" : period.label}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {(canLoadCourseShelf || useTailoredStart) && (
                        <div>
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="app-section-label">Courses</p>
                                {canLoadCourseShelf && (
                                    <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-subtle">
                                        {getPeriodLabel(selPeriod, selProgram)}
                                    </span>
                                )}
                            </div>
                            {tailoredDepartmentMissing ? (
                                departmentsError ? (
                                    <ErrorState message="Failed to load departments." onRetry={loadDepartments} />
                                ) : (
                                    <EmptyState
                                        title="We couldn't find your department"
                                        description="Your saved department is no longer listed. Choose your filters to continue."
                                        action={{ label: "Choose filters", onClick: () => setCustomizingProfile(true) }}
                                    />
                                )
                            ) : loadingDepts || loadingCourses || !canLoadCourseShelf ? (
                                <SkeletonList count={3} label="Loading courses" />
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
                                                <p className="text-base font-semibold text-ink">{course.name}</p>
                                                <p className="mt-1 text-sm text-faint">
                                                    {course.code} · {getProgramLabel(selProgram)} · {getPeriodLabel(selPeriod, selProgram)}
                                                </p>
                                            </div>
                                            <div className="rounded-full bg-fill px-3 py-2 text-xs font-bold text-white">
                                                Open
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {filter.coursesError && <ErrorState message={filter.coursesError} onRetry={filter.reloadCourses} />}
                    {error && <p className="text-center text-sm text-danger">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <ResourceShelf
            course={selCourse}
            loading={loadingResources}
            error={error}
            onRetry={() => {
                if (selCourse) void loadResources(selCourse);
            }}
            onBack={() => {
                setView("select");
                setSelCourse(null);
                useContentStore.getState().setSelectedCourse(null);
                useContentStore.getState().setResources([]);
            }}
        />
    );
}
