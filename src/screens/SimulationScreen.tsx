import { Bookmark, ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamPapers, getExamQuestions, submitAttempt, type ExamPaper } from "../api/quiz";
import ConfirmDialog from "../components/ConfirmDialog";
import QuestionCard from "../components/QuestionCard";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { useQuizStore } from "../store/quizStore";
import { getExitExamCategory, getExitExamMeta } from "../utils/exitExams";
import { formatDuration, formatTimeRemaining } from "../utils/format";
import { buildSubmissionAnswers, isQuestionAnswered } from "../utils/questions";

export default function SimulationScreen() {
    const navigate = useNavigate();
    const { examId } = useParams();
    const quiz = useQuizStore();

    const [exam, setExam] = useState<ExamPaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNavigator, setShowNavigator] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const isQuizActive = quiz.questions.length > 0 && !quiz.isComplete;
    const isQuizComplete = quiz.isComplete;

    useEffect(() => {
        if (!examId) {
            setError("Missing exam id.");
            setLoading(false);
            return;
        }

        getExamPapers({ type: "exit" })
            .then((papers) => {
                const selected = papers.find((paper) => paper.id === Number(examId)) ?? null;
                setExam(selected);
                if (!selected) setError("Exam paper not found.");
            })
            .catch(() => setError("Failed to load exam details."))
            .finally(() => setLoading(false));
    }, [examId]);

    useEffect(() => {
        if (isQuizComplete) navigate("/results", { replace: true });
    }, [isQuizComplete, navigate]);

    useEffect(() => {
        if (!isQuizActive || quiz.timeRemaining === null) return;

        if (quiz.timeRemaining <= 0) {
            void handleSubmit();
            return;
        }

        const timer = window.setInterval(() => {
            const next = (quiz.timeRemaining ?? 0) - 1;
            quiz.setTimeRemaining(Math.max(0, next));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isQuizActive, quiz, quiz.timeRemaining]);

    const answeredCount = useMemo(
        () => quiz.questions.filter((question) => isQuestionAnswered(question, quiz.answers)).length,
        [quiz.answers, quiz.questions]
    );
    const reviewCount = useMemo(
        () => Object.values(quiz.markedForReview).filter(Boolean).length,
        [quiz.markedForReview]
    );
    const unansweredCount = quiz.questions.length - answeredCount;
    const exitExamMeta = exam ? getExitExamMeta(getExitExamCategory(exam)) : null;
    const backTarget = exam ? `/exit-exam/list/${getExitExamCategory(exam)}` : "/exit-exam";
    const startLabel = "Start the exam";
    const totalDuration = quiz.totalTime ?? (exam?.duration_minutes ? exam.duration_minutes * 60 : 0);
    const timeRemaining = quiz.timeRemaining ?? totalDuration;
    const timeProgress = totalDuration > 0
        ? Math.max(0, Math.min(100, (timeRemaining / totalDuration) * 100))
        : 0;
    const isLowTime = timeRemaining > 0 && timeRemaining <= 300;
    const isCriticalTime = timeRemaining > 0 && timeRemaining <= 60;

    const handleStart = async () => {
        if (!exam) return;

        setStarting(true);
        setError(null);

        try {
            const questions = await getExamQuestions(exam.id, "simulation");
            quiz.setQuiz(questions, "simulation", undefined, exam.id, exam.duration_minutes * 60);
        } catch {
            setError("Failed to start the simulation.");
        } finally {
            setStarting(false);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!exam || submitting) return;

        setSubmitting(true);

        try {
            const result = await submitAttempt({
                exam_paper: exam.id,
                answers: Object.fromEntries(
                    Object.entries(buildSubmissionAnswers(quiz.questions, quiz.answers)).map(([questionId, selected]) => [String(questionId), selected])
                ),
                mode: "simulation",
            });

            quiz.completeQuiz(result);
        } catch {
            setError("Failed to submit the simulation.");
        } finally {
            setSubmitting(false);
        }
    }, [exam, quiz, submitting]);

    if (loading) {
        return (
            <div className="app-screen px-5 pt-12">
                <Skeleton className="h-56 rounded-[32px] mb-4" />
                <Skeleton className="h-40 rounded-[32px]" />
            </div>
        );
    }

    if (error && !exam && !isQuizActive) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <ErrorState message={error} onRetry={() => window.location.reload()} />
                </div>
            </div>
        );
    }

    if (!isQuizActive) {
        return (
            <div className="app-screen">
                <div className="app-topbar">
                    <div className="relative z-10">
                        <TopBackButton onClick={() => navigate(backTarget)} label="Back" />
                        <p className="app-section-label">{exitExamMeta?.badgeLabel ?? "Simulation"}</p>
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#18253D]">{exam?.title}</h1>
                        <p className="mt-2 text-sm leading-relaxed text-[#53627D]">
                            Timed mode with clear pacing, compact instructions, and minimal clutter.
                        </p>
                    </div>
                </div>

                <div className="app-scroll app-scroll-compact space-y-4">
                    <div className="app-grid-2">
                        <InfoTile label="Questions" value={exam?.total_questions ?? 0} />
                        <InfoTile label="Duration" value={formatDuration(exam?.duration_minutes ?? 0)} />
                    </div>

                    <div className="app-sheet p-5">
                        <p className="app-section-label">Rules</p>
                        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#53627D]">
                            <li>Answers stay hidden until the attempt is submitted.</li>
                            <li>The timer starts only after you tap the start button below.</li>
                            <li>Unanswered questions lower the final auto-graded score.</li>
                        </ul>

                        <div className="mt-4 rounded-[20px] bg-[#F4F7FD] px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7F8CA5]">
                                Before you start
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[#53627D]">
                                Read the rules first, then tap start. The countdown bar and timer chip begin immediately after that.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void handleStart()}
                            disabled={starting}
                            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-[20px] bg-[#18253D] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(24,37,61,0.18)] transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                                backgroundColor: "#18253D",
                                color: "#FFFFFF",
                                border: "1px solid #18253D",
                            }}
                        >
                            {starting ? "Starting..." : startLabel}
                        </button>
                    </div>

                    {error && <ErrorState message={error} />}
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[quiz.currentIndex];
    const isLast = quiz.currentIndex + 1 >= quiz.questions.length;
    const currentQuestionId = currentQuestion?.id;
    const currentMarkedForReview = currentQuestionId ? Boolean(quiz.markedForReview[currentQuestionId]) : false;

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => setShowLeaveModal(true)}
                        label="Leave"
                        trailing={(
                            <span className={`rounded-full px-3 py-2 text-xs font-bold transition-all ${isLowTime ? "bg-[#FFF0ED] text-[#D95A50]" : "bg-[#18253D] text-white"} ${isCriticalTime ? "animate-pulse shadow-[0_0_0_6px_rgba(217,90,80,0.12)]" : ""}`}>
                                {formatTimeRemaining(timeRemaining)}
                            </span>
                        )}
                    />

                    <div className="mt-2 app-grid-2">
                        <InfoTile label="Progress" value={`${quiz.currentIndex + 1}/${quiz.questions.length}`} />
                        <InfoTile label="Answered" value={`${answeredCount}/${quiz.questions.length}`} />
                    </div>

                    <div className="mt-3 app-sheet p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="app-section-label">Timer</p>
                            <span className={`text-xs font-bold uppercase tracking-[0.14em] ${isLowTime ? "text-[#D95A50]" : "text-[#60728F]"}`}>
                                {timeProgress.toFixed(0)}% left
                            </span>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[rgba(31,53,91,0.08)]">
                            <div
                                className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${isLowTime ? "bg-[#D95A50]" : "bg-[#18253D]"} ${isCriticalTime ? "animate-pulse" : ""}`}
                                style={{ width: `${timeProgress}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-3 app-sheet p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="app-icon-chip h-10 w-10 bg-[#EEF3FF] text-[#2D5BFF]">
                                    <LayoutGrid size={16} />
                                </div>
                                <div>
                                    <p className="app-section-label">Question navigator</p>
                                    <p className="mt-1 text-xs text-[#60728F]">
                                        Jump between questions and mark items for review.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNavigator((current) => !current)}
                                className="inline-flex items-center gap-2 rounded-full bg-[#F4F7FD] px-3 py-2 text-xs font-bold text-[#18253D]"
                            >
                                {showNavigator ? "Hide" : "Open"}
                                {showNavigator ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#EEF3FF] px-3 py-1.5 text-[11px] font-bold text-[#2D5BFF]">
                                {answeredCount} answered
                            </span>
                            <span className="rounded-full bg-[#FFF6DF] px-3 py-1.5 text-[11px] font-bold text-[#B27614]">
                                {reviewCount} review
                            </span>
                            <span className="rounded-full bg-[#F4F7FD] px-3 py-1.5 text-[11px] font-semibold text-[#60728F]">
                                {unansweredCount} unanswered
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => quiz.toggleMarkedForReview()}
                            className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.985] ${currentMarkedForReview ? "bg-[#FFF6DF] text-[#8E5A00]" : "bg-[#F4F7FD] text-[#18253D]"}`}
                        >
                            <Bookmark size={16} />
                            {currentMarkedForReview ? "Marked for review" : "Mark this question for review"}
                        </button>

                        {showNavigator && (
                            <div className="mt-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {quiz.questions.map((question, index) => {
                                        const isCurrent = index === quiz.currentIndex;
                                        const isAnswered = isQuestionAnswered(question, quiz.answers);
                                        const isMarked = Boolean(quiz.markedForReview[question.id]);

                                        const paletteClass = isCurrent
                                            ? "bg-[#18253D] text-white"
                                            : isMarked
                                                ? "bg-[#FFF6DF] text-[#8E5A00] border border-[#F1C364]"
                                                : isAnswered
                                                    ? "bg-[#EEF3FF] text-[#2D5BFF]"
                                                    : "bg-[#F4F7FD] text-[#60728F]";

                                        return (
                                            <button
                                                type="button"
                                                key={question.id}
                                                onClick={() => {
                                                    quiz.jumpToQuestion(index);
                                                    setShowNavigator(false);
                                                }}
                                                className={`flex min-h-12 items-center justify-center rounded-[16px] text-sm font-bold transition-all duration-150 active:scale-[0.98] ${paletteClass}`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#60728F]">
                                    <span className="rounded-full bg-[#18253D] px-3 py-1.5 text-white">Current</span>
                                    <span className="rounded-full bg-[#EEF3FF] px-3 py-1.5 text-[#2D5BFF]">Answered</span>
                                    <span className="rounded-full bg-[#FFF6DF] px-3 py-1.5 text-[#8E5A00]">Review</span>
                                    <span className="rounded-full bg-[#F4F7FD] px-3 py-1.5 text-[#60728F]">Unanswered</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <QuestionCard
                    question={currentQuestion}
                    questionNumber={quiz.currentIndex + 1}
                    totalQuestions={quiz.questions.length}
                    selectedAnswer={quiz.selectedAnswer}
                    onSelect={(answer) => quiz.setAnswer(answer)}
                    simulationMode
                    showQuestionType={false}
                />
            </div>

            <div className="app-footer space-y-3">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    style={{
                        backgroundColor: "#18253D",
                        color: "#FFFFFF",
                        borderColor: "#18253D",
                    }}
                    onClick={() => {
                        if (isLast) {
                            void handleSubmit();
                            return;
                        }
                        quiz.nextQuestion();
                    }}
                >
                    {isLast ? "Submit simulation" : "Next question"}
                </Button>
                <Button variant="ghost" size="md" fullWidth loading={submitting} onClick={() => void handleSubmit()}>
                    Finish now
                </Button>
            </div>

            <ConfirmDialog
                open={showLeaveModal}
                title="Leave this exam?"
                description="Your current progress will be lost if you leave before submitting."
                confirmLabel="Leave exam"
                cancelLabel="Stay here"
                onConfirm={() => {
                    setShowLeaveModal(false);
                    quiz.resetAttempt();
                    navigate(backTarget);
                }}
                onCancel={() => setShowLeaveModal(false)}
            />
        </div>
    );
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="app-sheet p-4">
            <p className="app-section-label">{label}</p>
            <p className="mt-2 text-lg font-black text-[#18253D]">{value}</p>
        </div>
    );
}
