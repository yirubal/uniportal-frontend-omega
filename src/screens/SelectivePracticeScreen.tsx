import { Brain, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { getSelectivePracticeChapters, startSelectivePractice, type SelectivePracticeChapter } from "../api/quiz";
import ChapterSelector from "../components/selective/ChapterSelector";
import FilterControls from "../components/selective/FilterControls";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useCourseFilter } from "../hooks/useCourseFilter";
import { useStudentProfile } from "../hooks/useStudentProfile";
import { useQuizStore } from "../store/quizStore";
import { getChapterDisplay, getChapterFilterValue } from "../utils/chapters";
import { getPeriodLabel, getProgramLabel } from "../utils/periods";

const NO_CHAPTERS: SelectivePracticeChapter[] = [];

export default function SelectivePracticeScreen() {
    const navigate = useNavigate();
    const profile = useStudentProfile();
    const { initializeSelectivePractice, resetAttempt } = useQuizStore(
        useShallow((state) => ({
            initializeSelectivePractice: state.initializeSelectivePractice,
            resetAttempt: state.resetAttempt,
        }))
    );

    const [customizingProfile, setCustomizingProfile] = useState(false);
    const useTailoredStart = profile.hasCompleteProfile && !customizingProfile;
    const filter = useCourseFilter({
        tailored: useTailoredStart,
        initial: {
            departmentId: profile.departmentId,
            program: profile.program,
            year: profile.year,
            period: profile.period,
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
        isComplete: canLoadCourses,
    } = filter;
    const loadingDepartments = filter.departmentsLoading;
    const loadingCourses = filter.coursesLoading;

    // Selections are derived from ids, so changing filters or course clears them without effects.
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;
    const [chaptersResult, setChaptersResult] = useState<{
        courseId: number | null;
        chapters: SelectivePracticeChapter[];
        error: string | null;
    }>({ courseId: null, chapters: [], error: null });
    const [chapterSelection, setChapterSelection] = useState<{ courseId: number | null; chapters: SelectivePracticeChapter[] }>({
        courseId: null,
        chapters: [],
    });
    const chaptersAreCurrent = selectedCourse !== null && chaptersResult.courseId === selectedCourse.id;
    const chapters = chaptersAreCurrent ? chaptersResult.chapters : NO_CHAPTERS;
    const loadingChapters = selectedCourse !== null && !chaptersAreCurrent;
    const selectedChapters = selectedCourse && chapterSelection.courseId === selectedCourse.id ? chapterSelection.chapters : NO_CHAPTERS;
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState<string | null>(null);
    const [chaptersReloadKey, setChaptersReloadKey] = useState(0);
    const chaptersError = chaptersAreCurrent ? chaptersResult.error : null;
    const error = startError
        ?? chaptersError
        ?? filter.coursesError
        ?? (filter.departmentsError ? "Failed to load departments." : null);
    // Retry whatever failed; a start error is retried with the Start button itself.
    const retryError = startError
        ? undefined
        : chaptersError
            ? () => {
                setChaptersResult({ courseId: null, chapters: [], error: null });
                setChaptersReloadKey((key) => key + 1);
            }
            : filter.coursesError
                ? filter.reloadCourses
                : filter.departmentsError
                    ? filter.reloadDepartments
                    : undefined;

    const currentStep = selectedCourse ? 2 : 1;
    const canStart = Boolean(selectedCourse && selectedChapters.length > 0 && !starting);
    const selectedDepartmentName = selDept?.name ?? "Your department";

    useEffect(() => {
        resetAttempt();
    }, [resetAttempt]);

    const selectedCourseKey = selectedCourse?.id ?? null;
    useEffect(() => {
        if (selectedCourseKey === null) return;

        // Abort when the course changes so chapters from the previous course can't land last.
        const controller = new AbortController();

        getSelectivePracticeChapters(selectedCourseKey, { signal: controller.signal })
            .then((items) => {
                if (!controller.signal.aborted) setChaptersResult({ courseId: selectedCourseKey, chapters: items, error: null });
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setChaptersResult({ courseId: selectedCourseKey, chapters: [], error: "Failed to load chapters for this course." });
                }
            });

        return () => controller.abort();
    }, [selectedCourseKey, chaptersReloadKey]);

    const selectedChapterSummary = useMemo(() => {
        if (selectedChapters.length === 0) return "Select at least one chapter";
        if (selectedChapters.length === 1) return getChapterDisplay(selectedChapters[0]);
        return `${selectedChapters.length} chapters selected`;
    }, [selectedChapters]);

    const handleBack = () => {
        if (selectedCourse) {
            setSelectedCourseId(null);
            setStartError(null);
            return;
        }

        navigate("/quiz");
    };

    const toggleChapter = (chapter: SelectivePracticeChapter) => {
        if (!selectedCourse) return;
        setChapterSelection((current) => {
            const chosen = current.courseId === selectedCourse.id ? current.chapters : [];
            return {
                courseId: selectedCourse.id,
                chapters: chosen.some((item) => item.id === chapter.id)
                    ? chosen.filter((item) => item.id !== chapter.id)
                    : [...chosen, chapter],
            };
        });
    };

    const handleStart = async () => {
        if (!selectedCourse || selectedChapters.length === 0 || starting) return;

        setStarting(true);
        setStartError(null);

        try {
            const selectedChapterFilters = selectedChapters.map(getChapterFilterValue);
            const result = await startSelectivePractice(selectedCourse.id, selectedChapterFilters, 50);

            if (result.filtered_count === 0 || result.questions.length === 0) {
                setStartError("No questions available for the selected chapters.");
                return;
            }

            initializeSelectivePractice(result.questions, selectedCourse, selectedChapters.map(getChapterDisplay));
            navigate("/quiz/selective/take");
        } catch {
            setStartError("Failed to start selective practice. Please try again.");
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
                        action={{ label: "Edit profile", onClick: () => navigate("/onboarding") }}
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
                        <ErrorState message={error} onRetry={retryError} />
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

                        {filter.departmentMissing && !filter.departmentsError ? (
                            <EmptyState
                                title="We couldn't find your department"
                                description="Your saved department is no longer listed. Choose your filters to continue."
                                action={{ label: "Choose filters", onClick: () => setCustomizingProfile(true) }}
                            />
                        ) : filter.departmentsError || filter.coursesError ? null : loadingDepartments || loadingCourses || !canLoadCourses ? (
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
                                        onClick={() => {
                                            setStartError(null);
                                            setSelectedCourseId(course.id);
                                        }}
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
