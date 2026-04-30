import { Brain, ChevronDown, FileText, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartments, getCourses } from "../api/content";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useStudentProfile } from "../hooks/useStudentProfile";
import type { Course, Department } from "../store/contentStore";
import { useQuizStore } from "../store/quizStore";
import { getPeriodLabel, getPeriodOptions, getProgramLabel, PROGRAM_OPTIONS, type ProgramType, YEAR_OPTIONS } from "../utils/periods";
import { getPracticeContentMeta } from "../utils/practice";

export default function PracticeSetupScreen() {
    const navigate = useNavigate();
    const profile = useStudentProfile();
    const {
        practiceContentType,
        departmentId,
        program,
        year,
        period,
        courseId,
        setQuizContext,
        resetAttempt,
    } = useQuizStore();

    const meta = getPracticeContentMeta(practiceContentType);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [customizingProfile, setCustomizingProfile] = useState(false);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selDept, setSelDept] = useState<Department | null>(null);
    const [selProgram, setSelProgram] = useState<ProgramType | null>(profile.program ?? program ?? null);
    const [selYear, setSelYear] = useState<number | null>(profile.year ?? year ?? null);
    const [selPeriod, setSelPeriod] = useState<number | null>(profile.period ?? period ?? null);
    const [selCourse, setSelCourse] = useState<Course | null>(null);
    const useTailoredStart = profile.hasCompleteProfile && !customizingProfile;
    const canLoadCourseShelf = Boolean(selDept && selProgram && selYear && selPeriod);
    const selectedDepartmentName = selDept?.name ?? "Your department";

    useEffect(() => {
        resetAttempt();
    }, [resetAttempt]);

    useEffect(() => {
        getDepartments()
            .then((depts) => {
                setDepartments(depts);
            })
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepts(false));
    }, []);

    useEffect(() => {
        const preferredDepartmentId = useTailoredStart ? profile.departmentId : departmentId ?? profile.departmentId;
        if (!preferredDepartmentId) return;

        const preferred = departments.find((item) => item.id === preferredDepartmentId) ?? null;
        setSelDept(preferred);

        if (useTailoredStart) {
            setSelProgram(profile.program);
            setSelYear(profile.year);
            setSelPeriod(profile.period);
        }
    }, [
        departmentId,
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
        setSelCourse(null);

        getCourses(selDept.id, selProgram, selYear, selPeriod)
            .then((items) => {
                setCourses(items);

                if (!courseId) return;
                const preferredCourse = items.find((item) => item.id === courseId) ?? null;
                setSelCourse(preferredCourse);
            })
            .catch(() => setError("Failed to load courses."))
            .finally(() => setLoadingCourses(false));
    }, [courseId, selDept, selProgram, selYear, selPeriod]);

    const handleOpenList = (course: Course) => {
        if (!practiceContentType || !selDept || !selProgram || !selYear || !selPeriod) return;

        setQuizContext({
            departmentId: selDept.id,
            program: selProgram,
            year: selYear,
            period: selPeriod,
            courseId: course.id,
            courseName: course.name,
        });

        navigate("/quiz/list");
    };

    if (!practiceContentType) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Choose a practice path first"
                        description="Open the Practice Hub first, then choose quiz or past exam."
                        actionLabel="Back to hub"
                        onAction={() => navigate("/quiz", { replace: true })}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/quiz")} label="Hub" />
                    <p className="app-section-label">{meta.sectionLabel}</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                        {useTailoredStart ? "Your courses" : meta.setupTitle}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                        {useTailoredStart
                            ? `${meta.navLabel} content is filtered from the profile you saved during setup.`
                            : meta.setupDescription}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet p-4">
                    <div className="flex items-start gap-3">
                        <div className={`app-icon-chip ${practiceContentType === "quiz" ? "bg-[#EAF4F1] text-[#3F6F6A]" : "bg-[#FFF6DF] text-[#B27614]"}`}>
                            <Layers3 size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">{useTailoredStart ? "Saved profile" : "Setup"}</p>
                            <p className="mt-2 text-sm font-semibold text-[#172B2F]">
                                {useTailoredStart ? selectedDepartmentName : "Department, program, year, period, and course"}
                            </p>
                            <p className="mt-1 text-sm text-[#526B70]">
                                {useTailoredStart
                                    ? profile.profileLabel
                                    : practiceContentType === "quiz"
                                        ? "Keep the scope narrow so the short quiz list is relevant."
                                        : "Past exam papers are grouped by course before the student opens a paper."}
                            </p>
                        </div>
                    </div>
                    {useTailoredStart && (
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

                <div className="mt-4">
                    {!useTailoredStart && (
                        <>
                            <p className="mb-3 app-section-label">Department</p>
                            {loadingDepts ? (
                                <div className="mb-5 flex flex-wrap gap-2">
                                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}
                                </div>
                            ) : (
                                <div className="mb-5 app-sheet p-4">
                                    <div className="relative">
                                        <select
                                            value={selDept?.id ?? ""}
                                            onChange={(event) => {
                                                const selectedId = Number(event.target.value);
                                                const selected = departments.find((department) => department.id === selectedId) ?? null;
                                                setSelDept(selected);
                                            }}
                                            className="min-h-14 w-full appearance-none rounded-[20px] border border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] px-4 pr-14 text-sm font-semibold text-[#172B2F] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition-all duration-150 focus:border-[rgba(63,111,106,0.24)] focus:bg-white focus:shadow-[0_10px_24px_rgba(23,43,47,0.1)]"
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

                            <p className="mb-3 app-section-label">Program</p>
                            <div className="mb-5 flex gap-2">
                                {PROGRAM_OPTIONS.map((item) => (
                                    <button
                                        type="button"
                                        key={item.value}
                                        onClick={() => setSelProgram(item.value)}
                                        className={`flex min-h-14 flex-1 items-center justify-center rounded-[20px] border px-4 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 ${
                                            selProgram === item.value
                                                ? "border-[rgba(23,43,47,0.1)] bg-[rgba(255,255,255,0.96)] text-[#172B2F] shadow-[0_8px_18px_rgba(23,43,47,0.08)]"
                                                : "border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] text-[#526B70]"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <p className="mb-3 app-section-label">Year</p>
                            <div className="mb-5 flex gap-2">
                                {YEAR_OPTIONS.map((item) => (
                                    <button
                                        type="button"
                                        key={item}
                                        onClick={() => setSelYear(item)}
                                        className={`flex min-h-14 flex-1 items-center justify-center rounded-[20px] border px-4 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 ${
                                            selYear === item
                                                ? "border-[rgba(23,43,47,0.1)] bg-[rgba(255,255,255,0.96)] text-[#172B2F] shadow-[0_8px_18px_rgba(23,43,47,0.08)]"
                                                : "border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] text-[#526B70]"
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>

                            <p className="mb-3 app-section-label">Period</p>
                            <div className="mb-5 flex gap-2">
                                {getPeriodOptions(selProgram).map((item) => (
                                    <button
                                        type="button"
                                        key={item.value}
                                        onClick={() => setSelPeriod(item.value)}
                                        className={`flex min-h-14 flex-1 items-center justify-center rounded-[20px] border px-4 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 ${
                                            selPeriod === item.value
                                                ? "border-[rgba(23,43,47,0.1)] bg-[rgba(255,255,255,0.96)] text-[#172B2F] shadow-[0_8px_18px_rgba(23,43,47,0.08)]"
                                                : "border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] text-[#526B70]"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {(canLoadCourseShelf || useTailoredStart) && (
                        <>
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="app-section-label">Courses</p>
                                {canLoadCourseShelf && (
                                    <span className="rounded-full bg-[#F4F8F5] px-2.5 py-1 text-[11px] font-bold text-[#526B70]">
                                        {getPeriodLabel(selPeriod, selProgram)}
                                    </span>
                                )}
                            </div>
                            {loadingDepts || loadingCourses || !canLoadCourseShelf ? (
                                <div className="mb-5 space-y-2">
                                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
                                </div>
                            ) : courses.length === 0 ? (
                                <EmptyState
                                    icon="📭"
                                    title="No courses found"
                                    description="Try a different set of filters."
                                />
                            ) : (
                                <div className="mb-5 space-y-3">
                                    {courses.map((course) => (
                                        <button
                                            type="button"
                                            key={course.id}
                                            onClick={() => {
                                                setSelCourse(course);
                                                handleOpenList(course);
                                            }}
                                            className={`app-list-item ${selCourse?.id === course.id ? "ring-2 ring-[#3F6F6A]/20" : ""}`}
                                        >
                                            <div className={`app-icon-chip ${practiceContentType === "quiz" ? "bg-[#EAF4F1] text-[#3F6F6A]" : "bg-[#FFF6DF] text-[#B27614]"}`}>
                                                {practiceContentType === "quiz" ? <Brain size={18} /> : <FileText size={18} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-[#172B2F]">
                                                    {course.name}
                                                </p>
                                                <p className="mt-1 text-xs text-[#70868B]">
                                                    {course.code} · {getProgramLabel(selProgram)} · {itemLabel(selPeriod, selProgram)}
                                                </p>
                                            </div>
                                            {selCourse?.id === course.id && (
                                                <span className="rounded-full bg-[#172B2F] px-3.5 py-2.5 text-xs font-bold text-white">
                                                    Selected
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {error && <ErrorState message={error} />}
                </div>
            </div>
        </div>
    );
}

function itemLabel(period: number, program: ProgramType) {
    return getPeriodLabel(period, program);
}
