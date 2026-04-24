import { BookOpenCheck, ClipboardList, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCourseQuizzes, type ExamPaper } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { formatDuration } from "../utils/format";
import { useQuizStore } from "../store/quizStore";

export default function QuizListScreen() {
    const navigate = useNavigate();
    const {
        courseId,
        courseName,
        selectedQuizId,
        setSelectedQuiz,
        resetAttempt,
    } = useQuizStore();

    const [quizzes, setQuizzes] = useState<ExamPaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        resetAttempt();
    }, [resetAttempt]);

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        getCourseQuizzes(courseId)
            .then(setQuizzes)
            .catch(() => setError("Failed to load quizzes for this course."))
            .finally(() => setLoading(false));
    }, [courseId]);

    if (!courseId) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Pick a course first"
                        description="The quiz list needs a course selection before it can load."
                        actionLabel="Back to quiz setup"
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
                    <TopBackButton onClick={() => navigate("/quiz")} label="Setup" />
                    <p className="app-section-label">Course quizzes</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#18253D]">{courseName ?? "Available quizzes"}</h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#53627D]">
                        Choose one quiz set, then open a focused attempt screen for it.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet p-4">
                    <div className="flex items-start gap-3">
                        <div className="app-icon-chip">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">Selected course</p>
                            <p className="mt-2 text-sm font-semibold text-[#18253D]">{courseName}</p>
                            <p className="mt-1 text-sm text-[#53627D]">
                                Each quiz loads independently and submits as a separate attempt.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <p className="mb-3 app-section-label">Available quizzes</p>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[28px]" />)}
                        </div>
                    ) : error ? (
                        <ErrorState message={error} onRetry={() => window.location.reload()} />
                    ) : quizzes.length === 0 ? (
                        <EmptyState
                            title="No quizzes yet"
                            description="This course does not have quiz sets available right now."
                            actionLabel="Choose another course"
                            onAction={() => navigate("/quiz")}
                        />
                    ) : (
                        <div className="space-y-3">
                            {quizzes.map((quiz) => (
                                <button
                                    type="button"
                                    key={quiz.id}
                                    onClick={() => {
                                        setSelectedQuiz(quiz.id, quiz.title);
                                        navigate(`/quiz/take/${quiz.id}`);
                                    }}
                                    className={`app-list-item ${selectedQuizId === quiz.id ? "ring-2 ring-[#2D5BFF]/20" : ""}`}
                                >
                                    <div className="app-icon-chip bg-[#EEF3FF] text-[#2D5BFF]">
                                        <BookOpenCheck size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2D5BFF]">
                                                Quiz
                                            </span>
                                            <span className="rounded-full bg-[#F4F7FD] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#60728F]">
                                                {quiz.year}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold leading-snug text-[#18253D]">
                                            {quiz.title}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-[#7F8CA5]">
                                            <span>{quiz.total_questions} questions</span>
                                            <span>{formatDuration(quiz.duration_minutes)}</span>
                                            <span>{quiz.access_level}</span>
                                        </div>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F7FD] text-[#18253D]">
                                        <TimerReset size={18} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
