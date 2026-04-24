import { Brain, ChevronDown, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartments, getCourses } from "../api/content";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import type { Course, Department } from "../store/contentStore";
import { useQuizStore } from "../store/quizStore";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

export default function QuizScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const {
        departmentId,
        year,
        semester,
        courseId,
        setQuizContext,
        resetAttempt,
    } = useQuizStore();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selDept, setSelDept] = useState<Department | null>(null);
    const [selYear, setSelYear] = useState<number | null>(year ?? student?.preferred_year ?? null);
    const [selSemester, setSelSemester] = useState<number | null>(semester ?? student?.preferred_semester ?? null);
    const [selCourse, setSelCourse] = useState<Course | null>(null);

    useEffect(() => {
        resetAttempt();
    }, [resetAttempt]);

    useEffect(() => {
        getDepartments()
            .then((depts) => {
                setDepartments(depts);

                const preferredDepartmentId = departmentId ?? student?.preferred_department;
                if (!preferredDepartmentId) return;

                const preferred = depts.find((item) => item.id === preferredDepartmentId) ?? null;
                setSelDept(preferred);
            })
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepts(false));
    }, [departmentId, student?.preferred_department]);

    useEffect(() => {
        if (!selDept || !selYear || !selSemester) return;

        setLoadingCourses(true);
        setError(null);
        setCourses([]);
        setSelCourse(null);

        getCourses(selDept.id, selYear, selSemester)
            .then((items) => {
                setCourses(items);

                if (!courseId) return;
                const preferredCourse = items.find((item) => item.id === courseId) ?? null;
                setSelCourse(preferredCourse);
            })
            .catch(() => setError("Failed to load courses."))
            .finally(() => setLoadingCourses(false));
    }, [courseId, selDept, selYear, selSemester]);

    const handleViewQuizzes = (course: Course) => {
        if (!selDept || !selYear || !selSemester) return;

        setQuizContext({
            departmentId: selDept.id,
            year: selYear,
            semester: selSemester,
            courseId: course.id,
            courseName: course.name,
        });

        navigate("/quiz/list");
    };

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Practice quiz</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#18253D]">Pick a course first</h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#53627D]">
                        Choose the exact course, then we will show the quizzes available for it.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet p-4">
                    <div className="flex items-start gap-3">
                        <div className="app-icon-chip">
                            <Layers3 size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">Setup</p>
                            <p className="mt-2 text-sm font-semibold text-[#18253D]">
                                Department, year, semester, and course
                            </p>
                            <p className="mt-1 text-sm text-[#53627D]">
                                Keep the scope narrow so the quiz list is relevant.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
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
                                    className="min-h-14 w-full appearance-none rounded-[20px] border border-[rgba(31,53,91,0.08)] bg-[rgba(244,247,252,0.92)] px-4 pr-14 text-sm font-semibold text-[#18253D] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition-all duration-150 focus:border-[rgba(45,91,255,0.24)] focus:bg-white focus:shadow-[0_10px_24px_rgba(20,38,67,0.1)]"
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
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#53627D] shadow-[0_6px_16px_rgba(20,38,67,0.08)]">
                                        <ChevronDown size={16} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="mb-3 app-section-label">Year</p>
                    <div className="mb-5 flex gap-2">
                        {YEARS.map((item) => (
                            <button
                                type="button"
                                key={item}
                                onClick={() => setSelYear(item)}
                                className={`flex min-h-14 flex-1 items-center justify-center rounded-[20px] border px-4 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 ${
                                    selYear === item
                                        ? "border-[rgba(31,53,91,0.1)] bg-[rgba(255,255,255,0.96)] text-[#18253D] shadow-[0_8px_18px_rgba(20,38,67,0.08)]"
                                        : "border-[rgba(31,53,91,0.08)] bg-[rgba(244,247,252,0.92)] text-[#53627D]"
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <p className="mb-3 app-section-label">Semester</p>
                    <div className="mb-5 flex gap-2">
                        {SEMESTERS.map((item) => (
                            <button
                                type="button"
                                key={item}
                                onClick={() => setSelSemester(item)}
                                className={`flex min-h-14 flex-1 items-center justify-center rounded-[20px] border px-4 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 ${
                                    selSemester === item
                                        ? "border-[rgba(31,53,91,0.1)] bg-[rgba(255,255,255,0.96)] text-[#18253D] shadow-[0_8px_18px_rgba(20,38,67,0.08)]"
                                        : "border-[rgba(31,53,91,0.08)] bg-[rgba(244,247,252,0.92)] text-[#53627D]"
                                }`}
                            >
                                Sem {item}
                            </button>
                        ))}
                    </div>

                    {selDept && selYear && selSemester && (
                        <>
                            <p className="mb-3 app-section-label">Course</p>
                            {loadingCourses ? (
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
                                                handleViewQuizzes(course);
                                            }}
                                            className={`app-list-item ${selCourse?.id === course.id ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                        >
                                            <div className="app-icon-chip">
                                                <Brain size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-[#18253D]">
                                                    {course.name}
                                                </p>
                                                <p className="mt-1 text-xs text-[#7F8CA5]">{course.code}</p>
                                            </div>
                                            {selCourse?.id === course.id && (
                                                <span className="rounded-full bg-[#18253D] px-3.5 py-2.5 text-xs font-bold text-white">
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
