import { Brain, Check, ChevronDown, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCourses, getDepartments } from "../api/content";
import { getSelectivePracticeChapters, startSelectivePractice, type SelectivePracticeChapter } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useStudentProfile } from "../hooks/useStudentProfile";
import type { Course, Department } from "../store/contentStore";
import { useQuizStore } from "../store/quizStore";
import { getPeriodLabel, getPeriodOptions, getProgramLabel, PROGRAM_OPTIONS, type ProgramType, YEAR_OPTIONS } from "../utils/periods";

export default function SelectivePracticeScreen() {
    const navigate = useNavigate();
    const profile = useStudentProfile();
    const { initializeSelectivePractice, resetAttempt } = useQuizStore();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [chapters, setChapters] = useState<SelectivePracticeChapter[]>([]);
    const [selectedChapters, setSelectedChapters] = useState<SelectivePracticeChapter[]>([]);
    const [customizingProfile, setCustomizingProfile] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selDept, setSelDept] = useState<Department | null>(null);
    const [selProgram, setSelProgram] = useState<ProgramType | null>(profile.program ?? null);
    const [selYear, setSelYear] = useState<number | null>(profile.year ?? null);
    const [selPeriod, setSelPeriod] = useState<number | null>(profile.period ?? null);

    const useTailoredStart = profile.hasCompleteProfile && !customizingProfile;
    const canLoadCourses = Boolean(selDept && selProgram && selYear && selPeriod);
    const currentStep = selectedCourse ? 2 : 1;
    const canStart = Boolean(selectedCourse && selectedChapters.length > 0 && !starting);
    const selectedDepartmentName = selDept?.name ?? "Your department";

    useEffect(() => {
        resetAttempt();
    }, [resetAttempt]);

    useEffect(() => {
        getDepartments()
            .then(setDepartments)
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepartments(false));
    }, []);

    useEffect(() => {
        const preferredDepartmentId = useTailoredStart ? profile.departmentId : profile.departmentId;
        if (!preferredDepartmentId) return;

        const preferred = departments.find((department) => department.id === preferredDepartmentId) ?? null;
        setSelDept(preferred);

        if (useTailoredStart) {
            setSelProgram(profile.program);
            setSelYear(profile.year);
            setSelPeriod(profile.period);
        }
    }, [
        departments,
        profile.departmentId,
        profile.period,
        profile.program,
        profile.year,
        useTailoredStart,
    ]);

    useEffect(() => {
        const validPeriods = getPeriodOptions(selProgram).map((item) => item.value);
        if (selPeriod && !validPeriods.includes(selPeriod)) {
            setSelPeriod(null);
        }
    }, [selPeriod, selProgram]);

    useEffect(() => {
        if (!selDept || !selProgram || !selYear || !selPeriod) return;

        setLoadingCourses(true);
        setError(null);
        setCourses([]);
        setSelectedCourse(null);
        setChapters([]);
        setSelectedChapters([]);

        getCourses(selDept.id, selProgram, selYear, selPeriod)
            .then(setCourses)
            .catch(() => setError("Failed to load courses."))
            .finally(() => setLoadingCourses(false));
    }, [selDept, selProgram, selYear, selPeriod]);

    useEffect(() => {
        if (!selectedCourse) return;

        setLoadingChapters(true);
        setError(null);
        setChapters([]);
        setSelectedChapters([]);

        getSelectivePracticeChapters(selectedCourse.id)
            .then((items) => setChapters(items))
            .catch(() => setError("Failed to load chapters for this course."))
            .finally(() => setLoadingChapters(false));
    }, [selectedCourse]);

    const selectedChapterSummary = useMemo(() => {
        if (selectedChapters.length === 0) return "Select at least one chapter";
        if (selectedChapters.length === 1) return getChapterDisplay(selectedChapters[0]);
        return `${selectedChapters.length} chapters selected`;
    }, [selectedChapters]);

    const handleBack = () => {
        if (selectedCourse) {
            setSelectedCourse(null);
            setChapters([]);
            setSelectedChapters([]);
            return;
        }

        navigate("/quiz");
    };

    const toggleChapter = (chapter: SelectivePracticeChapter) => {
        setSelectedChapters((current) =>
            current.some((item) => item.id === chapter.id)
                ? current.filter((item) => item.id !== chapter.id)
                : [...current, chapter]
        );
    };

    const handleStart = async () => {
        if (!selectedCourse || selectedChapters.length === 0 || starting) return;

        setStarting(true);
        setError(null);

        try {
            const selectedChapterFilters = selectedChapters.map(getChapterFilterValue);
            const result = await startSelectivePractice(selectedCourse.id, selectedChapterFilters, 50);

            if (result.filtered_count === 0 || result.questions.length === 0) {
                setError("No questions available for the selected chapters.");
                return;
            }

            initializeSelectivePractice(result.questions, selectedCourse, selectedChapters.map(getChapterDisplay));
            navigate("/quiz/selective/take");
        } catch {
            setError("Failed to start selective practice. Please try again.");
        } finally {
            setStarting(false);
        }
    };

    if (!profile.hasCompleteProfile && !customizingProfile) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Complete your profile first"
                        description="Selective Practice starts from your department, program, year, and period."
                        actionLabel="Edit profile"
                        onAction={() => navigate("/onboarding")}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={handleBack} label={selectedCourse ? "Courses" : "Hub"} />
                    <p className="app-section-label">Selective practice</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                        {selectedCourse ? "Choose chapters" : "Focus your practice"}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                        {selectedCourse
                            ? `Build a short practice set from ${selectedCourse.name}.`
                            : "Pick a course, then choose the chapters you want to work on."}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                {error && (
                    <div className="mb-4">
                        <ErrorState message={error} />
                    </div>
                )}

                <div className="app-sheet p-4">
                    <div className="flex items-start gap-3">
                        <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                            <Target size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="app-section-label">Step {currentStep} of 2</p>
                            <p className="mt-2 text-sm font-semibold text-[#172B2F]">
                                {selectedCourse ? selectedCourse.name : useTailoredStart ? selectedDepartmentName : "Custom course filter"}
                            </p>
                            <p className="mt-1 text-sm text-[#526B70] [overflow-wrap:anywhere]">
                                {selectedCourse ? selectedChapterSummary : profile.profileLabel}
                            </p>
                        </div>
                    </div>

                    {useTailoredStart && !selectedCourse && (
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setCustomizingProfile(true)}
                                className="flex-1 rounded-full border border-[rgba(23,43,47,0.10)] bg-white/85 px-3.5 py-2 text-xs font-bold text-[#172B2F]"
                            >
                                Change filters
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/onboarding")}
                                className="flex-1 rounded-full bg-[#EAF4F1] px-3.5 py-2 text-xs font-bold text-[#234C48]"
                            >
                                Edit profile
                            </button>
                        </div>
                    )}
                </div>

                {!selectedCourse && (
                    <section className="mt-5">
                        {!useTailoredStart && (
                            <FilterControls
                                departments={departments}
                                loadingDepartments={loadingDepartments}
                                selDept={selDept}
                                selProgram={selProgram}
                                selYear={selYear}
                                selPeriod={selPeriod}
                                onSelectDepartment={setSelDept}
                                onSelectProgram={setSelProgram}
                                onSelectYear={setSelYear}
                                onSelectPeriod={setSelPeriod}
                            />
                        )}

                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="app-section-label">Courses</p>
                            {canLoadCourses && (
                                <span className="rounded-full bg-[#F4F8F5] px-2.5 py-1 text-[11px] font-bold text-[#526B70]">
                                    {getPeriodLabel(selPeriod, selProgram)}
                                </span>
                            )}
                        </div>

                        {loadingDepartments || loadingCourses || !canLoadCourses ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 rounded-2xl" />)}
                            </div>
                        ) : courses.length === 0 ? (
                            <EmptyState
                                icon="📭"
                                title="No courses found"
                                description="Try a different profile filter."
                            />
                        ) : (
                            <div className="space-y-3">
                                {courses.map((course) => (
                                    <button
                                        type="button"
                                        key={`${course.id}-${course.program}-${course.year}-${course.period}`}
                                        onClick={() => setSelectedCourse(course)}
                                        className="app-list-item"
                                        aria-label={`Select ${course.name}`}
                                    >
                                        <div className="app-icon-chip bg-[#EAF4F1] text-[#3F6F6A]">
                                            <Brain size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[#172B2F] [overflow-wrap:anywhere]">
                                                {course.name}
                                            </p>
                                            <p className="mt-1 text-xs text-[#70868B]">
                                                {course.code} · {getProgramLabel(course.program)}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-[#F4F8F5] px-3 py-2 text-[11px] font-bold text-[#526B70]">
                                            Chapters
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {selectedCourse && (
                    <section className="mt-5">
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="app-section-label">Chapters</p>
                            <span className="rounded-full bg-[#EAF4F1] px-2.5 py-1 text-[11px] font-bold text-[#3F6F6A]">
                                {selectedChapters.length} selected
                            </span>
                        </div>

                        {loadingChapters ? (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-14 rounded-2xl" />)}
                            </div>
                        ) : chapters.length === 0 ? (
                            <EmptyState
                                icon="📭"
                                title="No chapters found"
                                description="This course does not have chapter-tagged questions yet."
                            />
                        ) : (
                            <ChapterSelector
                                chapters={chapters}
                                selectedChapters={selectedChapters}
                                onToggleChapter={toggleChapter}
                            />
                        )}
                    </section>
                )}
            </div>

            {selectedCourse && (
                <div className="app-footer">
                    <button
                        type="button"
                        disabled={!canStart}
                        onClick={() => void handleStart()}
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-[16px] border border-[#172B2F] bg-[#172B2F] px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(23,43,47,0.16)] transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:border-[#D1D5DB] disabled:bg-[#D1D5DB] disabled:text-[#4B5563] disabled:shadow-none"
                        style={{
                            backgroundColor: "#172B2F",
                            borderColor: "#172B2F",
                            color: "#FFFFFF",
                            opacity: canStart ? 1 : 0.62,
                            boxShadow: canStart ? "0 10px 24px rgba(23,43,47,0.16)" : "none",
                        }}
                    >
                        {starting
                            ? "Starting..."
                            : !canStart
                                ? "Select a chapter to continue"
                                : `Start Practice (${selectedChapters.length} chapter${selectedChapters.length === 1 ? "" : "s"})`}
                    </button>
                </div>
            )}
        </div>
    );
}

function FilterControls({
    departments,
    loadingDepartments,
    selDept,
    selProgram,
    selYear,
    selPeriod,
    onSelectDepartment,
    onSelectProgram,
    onSelectYear,
    onSelectPeriod,
}: {
    departments: Department[];
    loadingDepartments: boolean;
    selDept: Department | null;
    selProgram: ProgramType | null;
    selYear: number | null;
    selPeriod: number | null;
    onSelectDepartment: (department: Department | null) => void;
    onSelectProgram: (program: ProgramType) => void;
    onSelectYear: (year: number) => void;
    onSelectPeriod: (period: number) => void;
}) {
    return (
        <>
            <p className="mb-3 app-section-label">Department</p>
            {loadingDepartments ? (
                <Skeleton className="mb-5 h-14 rounded-2xl" />
            ) : (
                <div className="mb-5 app-sheet p-4">
                    <div className="relative">
                        <select
                            value={selDept?.id ?? ""}
                            onChange={(event) => {
                                const selectedId = Number(event.target.value);
                                onSelectDepartment(departments.find((department) => department.id === selectedId) ?? null);
                            }}
                            className="min-h-14 w-full appearance-none rounded-[20px] border border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] px-4 pr-14 text-sm font-semibold text-[#172B2F] outline-none transition-all duration-150 focus:border-[rgba(63,111,106,0.24)] focus:bg-white"
                        >
                            <option value="" disabled>
                                Select department
                            </option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#526B70] shadow-[0_6px_16px_rgba(23,43,47,0.08)]">
                                <ChevronDown size={16} />
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <SegmentedPicker
                label="Program"
                options={PROGRAM_OPTIONS}
                value={selProgram}
                onSelect={onSelectProgram}
            />

            <SegmentedPicker
                label="Year"
                options={YEAR_OPTIONS.map((year) => ({ value: year, label: String(year) }))}
                value={selYear}
                onSelect={onSelectYear}
            />

            <SegmentedPicker
                label="Period"
                options={getPeriodOptions(selProgram)}
                value={selPeriod}
                onSelect={onSelectPeriod}
            />
        </>
    );
}

function ChapterSelector({
    chapters,
    selectedChapters,
    onToggleChapter,
}: {
    chapters: SelectivePracticeChapter[];
    selectedChapters: SelectivePracticeChapter[];
    onToggleChapter: (chapter: SelectivePracticeChapter) => void;
}) {
    const selectedPercent = chapters.length
        ? Math.round((selectedChapters.length / chapters.length) * 100)
        : 0;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[#E0E0E0] bg-[#F5F7FA] px-4 py-3">
                <p className="min-w-0 text-[15px] font-medium leading-[1.5] text-[#1F2937]">
                    Select one or more chapters to practice.
                </p>
                <span className="shrink-0 rounded-[8px] bg-[#EAF4F1] px-3 py-2 text-[13px] font-bold text-[#234C48]">
                    {selectedChapters.length || "Tap"} selected
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {chapters.map((chapter) => {
                    const selected = selectedChapters.some((item) => item.id === chapter.id);
                    const chapterDisplay = getChapterDisplay(chapter);

                    return (
                        <button
                            key={chapter.id}
                            type="button"
                            onClick={() => onToggleChapter(chapter)}
                            aria-pressed={selected}
                            aria-label={`${chapterDisplay}: ${chapter.title}, ${selected ? "selected" : "not selected"}`}
                            className={`flex min-h-[8.75rem] min-w-0 max-w-full flex-col items-stretch gap-3 overflow-visible rounded-[16px] border-2 p-4 text-left transition-all duration-150 active:scale-[0.985] ${
                                selected
                                    ? "border-[#172B2F] bg-[#172B2F] text-white shadow-[0_10px_24px_rgba(23,43,47,0.20)]"
                                    : "border-[#E0E0E0] bg-white text-[#1F2937] shadow-[0_8px_18px_rgba(23,43,47,0.04)]"
                            }`}
                            style={{
                                paddingTop: "1.125rem",
                                paddingInline: "0.75rem",
                                ...(selected
                                    ? {
                                        backgroundColor: "#172B2F",
                                        borderColor: "#172B2F",
                                    }
                                    : {}),
                            }}
                        >
                            <div
                                className="flex min-h-10 items-center justify-between gap-3"
                                style={{ paddingInlineStart: "1rem", paddingInlineEnd: "0.25rem" }}
                            >
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                                    selected
                                        ? "bg-[rgba(255,255,255,0.20)] text-white"
                                        : "bg-[#F3F4F6] text-[#374151]"
                                }`}>
                                    {chapter.number}
                                </span>
                                <span className={`mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                    selected
                                        ? "bg-[rgba(255,255,255,0.24)] text-white"
                                        : "bg-transparent text-transparent"
                                }`}>
                                    <Check size={15} strokeWidth={3} aria-hidden="true" />
                                </span>
                            </div>

                            <div className="flex min-w-0 max-w-full flex-1 flex-col items-center justify-center overflow-hidden px-1 text-center">
                                <p className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-[1.4] ${
                                    selected ? "text-white" : "text-[#1F2937]"
                                }`}
                                style={{
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>
                                    {chapterDisplay}
                                </p>
                                <p className={`mt-2 text-xs font-semibold ${
                                    selected ? "text-white/75" : "text-[#70868B]"
                                }`}>
                                    {chapter.question_count > 0
                                        ? `${chapter.question_count} questions`
                                        : "Questions available"}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedChapters.length > 0 && (
                <div className="rounded-[16px] border border-[#E0E0E0] bg-[#F9FAFB] px-4 py-3">
                    <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div
                            className="h-full rounded-full bg-[#0A1628] transition-[width] duration-200"
                            style={{ width: `${selectedPercent}%` }}
                        />
                    </div>
                    <p className="mt-2 text-center text-[13px] font-medium text-[#6B7280]">
                        {selectedPercent}% of chapters selected
                    </p>
                </div>
            )}
        </div>
    );
}

function getChapterDisplay(chapter: SelectivePracticeChapter) {
    return `Chapter ${chapter.number}`;
}

function getChapterFilterValue(chapter: SelectivePracticeChapter) {
    if (chapter.filter_value) return chapter.filter_value;
    if (/^(chapter|ch)\s+\d+/i.test(chapter.title)) return chapter.title;
    return `Chapter ${chapter.number}: ${chapter.title}`;
}

function SegmentedPicker<T extends string | number>({
    label,
    options,
    value,
    onSelect,
}: {
    label: string;
    options: { value: T; label: string }[];
    value: T | null;
    onSelect: (value: T) => void;
}) {
    return (
        <>
            <p className="mb-3 app-section-label">{label}</p>
            <div className="mb-5 flex gap-2">
                {options.map((item) => (
                    <button
                        type="button"
                        key={String(item.value)}
                        onClick={() => onSelect(item.value)}
                        className={`flex min-h-14 flex-1 items-center justify-center rounded-[20px] border px-3 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 ${
                            value === item.value
                                ? "border-[rgba(23,43,47,0.1)] bg-[rgba(255,255,255,0.96)] text-[#172B2F] shadow-[0_8px_18px_rgba(23,43,47,0.08)]"
                                : "border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] text-[#526B70]"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </>
    );
}
