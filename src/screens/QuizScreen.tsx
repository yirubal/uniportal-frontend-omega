import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useQuizStore } from "../store/quizStore";
import { getDepartments, getCourses } from "../api/content";
import { getQuestions, submitAttempt } from "../api/quiz";
import { Department, Course } from "../store/contentStore";
import QuestionCard from "../components/QuestionCard";
import Button from "../components/ui/Button";
import { Skeleton, EmptyState, ErrorState } from "../components/ui";

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2];

export default function QuizScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const quiz = useQuizStore();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selDept, setSelDept] = useState<Department | null>(null);
    const [selYear, setSelYear] = useState<number | null>(student?.preferred_year ?? null);
    const [selSemester, setSelSemester] = useState<number | null>(student?.preferred_semester ?? null);
    const [selCourse, setSelCourse] = useState<Course | null>(null);

    const isQuizActive = quiz.questions.length > 0 && !quiz.isComplete;
    const isQuizComplete = quiz.isComplete;

    useEffect(() => {
        getDepartments()
            .then((depts) => {
                setDepartments(depts);
                if (student?.preferred_department) {
                    const pref = depts.find((d) => d.id === student.preferred_department);
                    if (pref) setSelDept(pref);
                }
            })
            .catch(() => setError("Failed to load departments."))
            .finally(() => setLoadingDepts(false));
    }, []);

    useEffect(() => {
        if (!selDept || !selYear || !selSemester) return;
        setLoadingCourses(true);
        setSelCourse(null);
        setCourses([]);
        getCourses(selDept.id, selYear, selSemester)
            .then(setCourses)
            .catch(() => setError("Failed to load courses."))
            .finally(() => setLoadingCourses(false));
    }, [selDept?.id, selYear, selSemester]);

    useEffect(() => {
        if (isQuizComplete) {
            navigate("/results", { replace: true });
        }
    }, [isQuizComplete]);

    const handleStartQuiz = async () => {
        if (!selCourse) return;
        setStarting(true);
        setError(null);
        try {
            const questions = await getQuestions(selCourse.id, {
                mode: "practice",
                limit: 10,
            });
            if (questions.length === 0) {
                setError("No questions found for this course.");
                return;
            }
            quiz.setQuiz(questions, "practice", selCourse.id);
        } catch {
            setError("Failed to load questions. Please try again.");
        } finally {
            setStarting(false);
        }
    };

    const handleAnswer = (option: "a" | "b" | "c" | "d") => {
        quiz.setAnswer(option);
    };

    const handleNext = useCallback(async () => {
        const { questions, currentIndex, answers, courseId, mode } = quiz;
        const isLast = currentIndex + 1 >= questions.length;

        if (!isLast) {
            quiz.nextQuestion();
            return;
        }

        try {
            const answerList = Object.entries(answers).map(([qId, opt]) => ({
                question_id: Number(qId),
                selected_option: opt as "a" | "b" | "c" | "d",
            }));
            const result = await submitAttempt({
                course_id: courseId ?? undefined,
                answers: answerList,
                mode,
            });
            quiz.completeQuiz(result.score, result.results);
        } catch {
            const correctCount = questions.filter(
                (q) => answers[q.id] === q.correct_option
            ).length;
            quiz.completeQuiz(correctCount, []);
        }
    }, [quiz]);

    if (isQuizActive) {
        const q = quiz.questions[quiz.currentIndex];
        const isLast = quiz.currentIndex + 1 >= quiz.questions.length;

        return (
            <div className="fixed inset-0 flex flex-col bg-[#F5F7FA]">
                <div className="bg-[#0A1628] px-5 pt-12 pb-5 flex items-center justify-between">
                    <button
                        onClick={() => quiz.resetQuiz()}
                        className="text-[#8899AA] text-sm active:opacity-70"
                    >
                        ✕ Exit
                    </button>
                    <span className="text-[#FFB400] text-xs font-bold uppercase tracking-widest">
                        Practice Quiz
                    </span>
                    <span className="text-[#8899AA] text-sm">
                        {quiz.currentIndex + 1}/{quiz.questions.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5">
                    <QuestionCard
                        question={q}
                        questionNumber={quiz.currentIndex + 1}
                        totalQuestions={quiz.questions.length}
                        selectedOption={quiz.selectedOption}
                        showExplanation={quiz.showExplanation}
                        onSelect={handleAnswer}
                    />
                </div>

                {quiz.selectedOption && (
                    <div className="px-5 pb-10 pt-3 animate-fade-in-up">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleNext}
                        >
                            {isLast ? "Submit Quiz 🏁" : "Next Question →"}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-[#F5F7FA]">
            <div className="bg-[#0A1628] px-5 pt-12 pb-5">
                <h1 className="text-white text-xl font-bold">Practice Quiz</h1>
                <p className="text-[#8899AA] text-sm mt-0.5">
                    Select a course and start practising
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 pb-28">
                <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-2">
                    Department
                </p>
                {loadingDepts ? (
                    <div className="flex gap-2 mb-5 flex-wrap">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}
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

                {selDept && selYear && selSemester && (
                    <>
                        <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-2">
                            Course
                        </p>
                        {loadingCourses ? (
                            <div className="space-y-2 mb-5">
                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
                            </div>
                        ) : courses.length === 0 ? (
                            <EmptyState
                                icon="📭"
                                title="No courses found"
                                description="Try different filters."
                            />
                        ) : (
                            <div className="flex flex-col gap-2 mb-5">
                                {courses.map((course) => (
                                    <button
                                        key={course.id}
                                        onClick={() => setSelCourse(course)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] text-left ${
                                            selCourse?.id === course.id
                                                ? "border-[#FFB400] bg-[#FFB400]/8"
                                                : "bg-white border-[#E0E0E0]"
                                        }`}
                                    >
                                        <div>
                                            <p className="text-[#0A1628] text-sm font-semibold">
                                                {course.name}
                                            </p>
                                            <p className="text-[#999] text-xs mt-0.5">{course.code}</p>
                                        </div>
                                        {selCourse?.id === course.id && (
                                            <span className="text-[#FFB400] text-lg">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {error && <p className="text-[#F44336] text-sm text-center mt-2">{error}</p>}
            </div>

            <div className="px-5 pb-10 pt-3 bg-[#F5F7FA] border-t border-[#EAEAEA]">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!selCourse}
                    loading={starting}
                    onClick={handleStartQuiz}
                >
                    Start Quiz 🧠
                </Button>
            </div>
        </div>
    );
}
