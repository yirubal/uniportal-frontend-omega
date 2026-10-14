import { Bookmark, LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getExitExams, getExamQuestions, submitAttempt, type ExamPaper } from "../api/quiz";
import ConfirmDialog from "../components/ConfirmDialog";
import QuestionCard from "../components/QuestionCard";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { useQuizStore } from "../store/quizStore";
import { getExitExamCategory, getExitExamMeta } from "../utils/exitExams";
import { formatDuration, formatTimeRemaining } from "../utils/format";
import { getErrorMessage } from "../utils/errors";
import { buildSubmissionAnswers, isQuestionAnswered } from "../utils/questions";

export default function SimulationScreen() {
    const navigate = useNavigate();
    const { examId } = useParams();
    const location = useLocation();
    // The exam list passes the paper through router state, so the start page doesn't refetch every exit exam.
    const routedExam = (location.state as { exam?: ExamPaper } | null)?.exam;
    const quiz = useQuizStore();
    const handleSubmitCallRef = useRef<() => void>(() => {});
    // Note: handleSubmitCallRef.current is assigned after handleSubmit is declared below
    const submittingRef = useRef(false);
    const autoSubmittedRef = useRef(false);

    const [exam, setExam] = useState<ExamPaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showNavigator, setShowNavigator] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);

    // Only treat the stored attempt as active when it belongs to the exam in the URL.
    const isQuizActive =
        quiz.questions.length > 0 &&
        !quiz.isComplete &&
        quiz.mode === "simulation" &&
        quiz.examPaperId === Number(examId);

    useEffect(() => {
        if (!examId) {
            setError("Missing exam id.");
            setLoading(false);
            return;
        }

        if (routedExam?.id === Number(examId)) {
            setExam(routedExam);
            setLoading(false);
            return;
        }

        // Deep link, reload or retake from Performance: look the paper up.
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        getExitExams(undefined, { signal: controller.signal })
            .then((papers) => {
                if (controller.signal.aborted) return;
                const selected = papers.find((paper) => paper.id === Number(examId)) ?? null;
                setExam(selected);
                if (!selected) setError("Exam paper not found.");
            })
            .catch(() => {
                if (!controller.signal.aborted) setError("Failed to load exam details.");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [examId, routedExam, reloadKey]);

    // Timer effect — only depends on isQuizActive, NOT the full quiz object or timeRemaining.
    // Time left is derived from the stored deadline, so throttled or paused intervals
    // (Telegram minimized, hidden tab) can't stretch the exam beyond its real duration.
    useEffect(() => {
        if (!isQuizActive) return;

        const tick = () => {
            const { deadline, setTimeRemaining } = useQuizStore.getState();
            if (deadline === null) return;

            const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setTimeRemaining(remaining);

            if (remaining <= 0) {
                window.clearInterval(timer);
                // Submit once on expiry; a failed submit is retried manually, not every tick.
                if (!autoSubmittedRef.current) {
                    autoSubmittedRef.current = true;
                    handleSubmitCallRef.current();
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") tick();
        };

        autoSubmittedRef.current = false;
        const timer = window.setInterval(tick, 1000);
        tick();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isQuizActive]);

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
    const timeExpired = isQuizActive && quiz.deadline !== null && timeRemaining <= 0;

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
        // Ref guard: state-based guards can be stale between rapid taps and the expiry auto-submit.
        if (!exam || submittingRef.current) return;

        // Read live store values via getState() — do NOT put quiz (full object) in deps
        const { questions, answers, completeQuiz } = useQuizStore.getState();

        submittingRef.current = true;
        setSubmitting(true);
        setSubmitError(null);

        try {
            const result = await submitAttempt({
                exam_paper: exam.id,
                answers: Object.fromEntries(
                    Object.entries(buildSubmissionAnswers(questions, answers)).map(([questionId, selected]) => [String(questionId), selected])
                ),
                mode: "simulation",
            });

            completeQuiz(result);
            // Navigate from here, not from an isComplete effect: a finished attempt is persisted and
            // must not redirect the next visit to an old result.
            navigate("/results", { replace: true });
        } catch (submitFailure) {
            setSubmitError(getErrorMessage(submitFailure, "Failed to submit the simulation."));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    // No quiz object in deps — reads store via getState() to avoid full-store re-subscription problem
    }, [exam, navigate]);

    // Keep the call ref up to date after handleSubmit is declared (avoids used-before-declared error)
    useEffect(() => { handleSubmitCallRef.current = () => { void handleSubmit(); }; }, [handleSubmit]);

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
                <div className="app-topbar">
                    <div className="relative z-10">
                        <TopBackButton onClick={() => navigate("/exit-exam")} label="Exit exams" />
                    </div>
                </div>
                <div className="app-scroll app-scroll-compact">
                    <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
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
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">{exam?.title}</h1>
                        <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
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
                        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#526B70]">
                            <li>Answers stay hidden until the attempt is submitted.</li>
                            <li>The timer starts only after you tap the start button below.</li>
                            <li>Unanswered questions lower the final auto-graded score.</li>
                        </ul>

                        <div className="mt-4 rounded-[20px] bg-[#F4F8F5] px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#70868B]">
                                Before you start
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                                Read the rules first, then tap start. The countdown bar and timer chip begin immediately after that.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => void handleStart()}
                            disabled={starting}
                            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-[20px] bg-[#172B2F] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(23,43,47,0.18)] transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                                backgroundColor: "#172B2F",
                                color: "#FFFFFF",
                                border: "1px solid #172B2F",
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
                            <span className={`rounded-full px-3 py-2 text-xs font-bold transition-all ${isLowTime ? "bg-[#FFF0ED] text-[#D95A50]" : "bg-[#172B2F] text-white"} ${isCriticalTime ? "animate-pulse shadow-[0_0_0_6px_rgba(217,90,80,0.12)]" : ""}`}>
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
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[rgba(23,43,47,0.08)]">
                            <div
                                className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${isLowTime ? "bg-[#D95A50]" : "bg-[#172B2F]"} ${isCriticalTime ? "animate-pulse" : ""}`}
                                style={{ width: `${timeProgress}%` }}
                            />
                        </div>
                    </div>

                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <QuestionCard
                    key={currentQuestion.id}
                    question={currentQuestion}
                    questionNumber={quiz.currentIndex + 1}
                    totalQuestions={quiz.questions.length}
                    selectedAnswer={quiz.selectedAnswer}
                    onSelect={(answer) => quiz.setAnswer(answer)}
                    simulationMode
                    showQuestionType={false}
                />

                {showNavigator && (
                    <div className="mt-4 app-sheet p-4">
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#EAF4F1] px-3 py-1.5 text-[11px] font-bold text-[#3F6F6A]">
                                {answeredCount} answered
                            </span>
                            <span className="rounded-full bg-[#FFF6DF] px-3 py-1.5 text-[11px] font-bold text-[#B27614]">
                                {reviewCount} review
                            </span>
                            <span className="rounded-full bg-[#F4F8F5] px-3 py-1.5 text-[11px] font-semibold text-[#60728F]">
                                {unansweredCount} unanswered
                            </span>
                        </div>

                        <div className="mt-4 grid grid-cols-5 gap-2">
                            {quiz.questions.map((question, index) => {
                                const isCurrent = index === quiz.currentIndex;
                                const isAnswered = isQuestionAnswered(question, quiz.answers);
                                const isMarked = Boolean(quiz.markedForReview[question.id]);

                                const paletteClass = isCurrent
                                    ? "bg-[#172B2F] text-white"
                                    : isMarked
                                        ? "bg-[#FFF6DF] text-[#8E5A00] border border-[#F1C364]"
                                        : isAnswered
                                            ? "bg-[#EAF4F1] text-[#3F6F6A]"
                                            : "bg-[#F4F8F5] text-[#60728F]";

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
                    </div>
                )}
            </div>

            <div className="app-footer space-y-3">
                {(submitError || timeExpired) && (
                    <div role="alert" className="rounded-[16px] border border-[#F3C9C3] bg-[#FFF0ED] px-4 py-3 text-sm leading-relaxed text-[#A8443A]">
                        {timeExpired && <p className="font-semibold">Time is up.</p>}
                        <p>
                            {submitError
                                ? `Your answers were not submitted: ${submitError} Tap submit to try again.`
                                : "Submitting your answers..."}
                        </p>
                    </div>
                )}
                {!timeExpired && (
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" size="md" fullWidth onClick={() => setShowNavigator((current) => !current)}>
                        <LayoutGrid size={16} />
                        {showNavigator ? "Hide list" : "Navigator"}
                    </Button>
                    <Button variant="secondary" size="md" fullWidth onClick={() => quiz.toggleMarkedForReview()}>
                        <Bookmark size={16} />
                        {currentMarkedForReview ? "Reviewed" : "Review"}
                    </Button>
                </div>
                )}
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={submitting}
                    style={{
                        backgroundColor: "#172B2F",
                        color: "#FFFFFF",
                        borderColor: "#172B2F",
                    }}
                    onClick={() => {
                        if (isLast || timeExpired) {
                            void handleSubmit();
                            return;
                        }
                        quiz.nextQuestion();
                    }}
                >
                    {submitting
                        ? "Submitting..."
                        : timeExpired
                            ? "Submit answers"
                            : isLast
                                ? "Submit simulation"
                                : "Next question"}
                </Button>
                {!timeExpired && (
                    <Button
                        variant="ghost"
                        size="md"
                        fullWidth
                        loading={submitting}
                        onClick={() => (unansweredCount > 0 ? setShowFinishConfirm(true) : void handleSubmit())}
                    >
                        Finish now
                    </Button>
                )}
            </div>

            <ConfirmDialog
                open={showFinishConfirm && !timeExpired}
                title="Submit the exam now?"
                description={`You have ${unansweredCount} unanswered ${unansweredCount === 1 ? "question" : "questions"} and time left on the clock. Unanswered questions earn no points.`}
                confirmLabel="Submit exam"
                cancelLabel="Keep going"
                onConfirm={() => {
                    setShowFinishConfirm(false);
                    void handleSubmit();
                }}
                onCancel={() => setShowFinishConfirm(false)}
            />

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
            <p className="mt-2 text-lg font-black text-[#172B2F]">{value}</p>
        </div>
    );
}
