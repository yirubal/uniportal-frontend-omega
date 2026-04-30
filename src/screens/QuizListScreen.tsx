import { BookOpenCheck, ClipboardList, FileText, Lock, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCoursePracticePapers, type ExamPaper } from "../api/quiz";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { formatDuration } from "../utils/format";
import { useQuizStore } from "../store/quizStore";
import { getPracticeContentMeta } from "../utils/practice";
import { useAccess } from "../hooks/useAccess";

export default function QuizListScreen() {
    const navigate = useNavigate();
    const {
        practiceContentType,
        courseId,
        courseName,
        selectedQuizId,
        setSelectedQuiz,
        resetAttempt,
    } = useQuizStore();
    const { isPremium } = useAccess();

    const [quizzes, setQuizzes] = useState<ExamPaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const meta = getPracticeContentMeta(practiceContentType);

    useEffect(() => {
        resetAttempt();
    }, [resetAttempt]);

    useEffect(() => {
        if (!courseId || !practiceContentType) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        getCoursePracticePapers(courseId, practiceContentType)
            .then(setQuizzes)
            .catch(() => setError(`Failed to load ${meta.listLabel.toLowerCase()} for this course.`))
            .finally(() => setLoading(false));
    }, [courseId, meta.listLabel, practiceContentType]);

    if (!practiceContentType) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Choose a practice path first"
                        description="Open the Practice Hub and choose quiz or past exam before loading a list."
                        actionLabel="Back to hub"
                        onAction={() => navigate("/quiz", { replace: true })}
                    />
                </div>
            </div>
        );
    }

    if (!courseId) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Pick a course first"
                        description={`The ${meta.listLabel.toLowerCase()} view needs a course selection before it can load.`}
                        actionLabel="Back to setup"
                        onAction={() => navigate("/quiz/setup", { replace: true })}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/quiz/setup")} label="Setup" />
                    <p className="app-section-label">{meta.sectionLabel}</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                        {courseName ?? meta.listLabel}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                        {meta.listDescription}
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
                            <p className="mt-2 text-sm font-semibold text-[#172B2F]">{courseName}</p>
                            <p className="mt-1 text-sm text-[#526B70]">
                                {practiceContentType === "quiz"
                                    ? "Each quiz loads independently and submits as a separate attempt."
                                    : "Each past exam paper loads as its own practice attempt."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <p className="mb-3 app-section-label">{meta.listLabel}</p>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-[28px]" />)}
                        </div>
                    ) : error ? (
                        <ErrorState message={error} onRetry={() => window.location.reload()} />
                    ) : quizzes.length === 0 ? (
                        <EmptyState
                            title={meta.emptyTitle}
                            description={meta.emptyDescription}
                            actionLabel="Choose another course"
                            onAction={() => navigate("/quiz/setup")}
                        />
                    ) : (
                        <div className="space-y-3">
                            {quizzes.map((quiz) => (
                                <QuizPaperButton
                                    key={quiz.id}
                                    quiz={quiz}
                                    isLocked={quiz.access_level === "premium" && !isPremium}
                                    isSelected={selectedQuizId === quiz.id}
                                    practiceContentType={practiceContentType}
                                    onOpen={() => {
                                        if (quiz.access_level === "premium" && !isPremium) {
                                            navigate("/subscribe");
                                            return;
                                        }

                                        setSelectedQuiz(quiz.id, quiz.title);
                                        navigate(`/quiz/take/${quiz.id}`);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function QuizPaperButton({
    quiz,
    isLocked,
    isSelected,
    practiceContentType,
    onOpen,
}: {
    quiz: ExamPaper;
    isLocked: boolean;
    isSelected: boolean;
    practiceContentType: "quiz" | "past_exam";
    onOpen: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className={`app-list-item ${isSelected ? "ring-2 ring-[#3F6F6A]/20" : ""}`}
        >
            <div className={`app-icon-chip ${practiceContentType === "quiz" ? "bg-[#EAF4F1] text-[#3F6F6A]" : "bg-[#FFF6DF] text-[#B27614]"}`}>
                {practiceContentType === "quiz" ? <BookOpenCheck size={18} /> : <FileText size={18} />}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${practiceContentType === "quiz" ? "bg-[#EAF4F1] text-[#3F6F6A]" : "bg-[#FFF6DF] text-[#B27614]"}`}>
                        {practiceContentType === "quiz" ? "Quiz" : "Past exam"}
                    </span>
                    <span className="rounded-full bg-[#F4F8F5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#60728F]">
                        {quiz.year}
                    </span>
                    {isLocked && (
                        <span className="rounded-full bg-[#FFF0ED] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B75F57]">
                            Premium
                        </span>
                    )}
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug text-[#172B2F]">
                    {quiz.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-[#70868B]">
                    <span>{quiz.total_questions} questions</span>
                    <span>{formatDuration(quiz.duration_minutes)}</span>
                    <span>{quiz.access_level}</span>
                </div>
            </div>

            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isLocked ? "bg-[#FFF0ED] text-[#B75F57]" : "bg-[#F4F8F5] text-[#172B2F]"}`}>
                {isLocked ? <Lock size={18} /> : <TimerReset size={18} />}
            </div>
        </button>
    );
}
