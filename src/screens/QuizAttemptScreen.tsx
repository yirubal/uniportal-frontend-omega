import { Brain, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamQuestions, submitAttempt } from "../api/quiz";
import ConfirmDialog from "../components/ConfirmDialog";
import QuestionCard from "../components/QuestionCard";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { AttemptSummary, useQuizStore } from "../store/quizStore";
import { getPracticeContentMeta } from "../utils/practice";
import { buildSubmissionAnswers, isOptionQuestion, isQuestionAnswered } from "../utils/questions";

export default function QuizAttemptScreen({ selectiveMode = false }: { selectiveMode?: boolean }) {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const quiz = useQuizStore();
    const meta = getPracticeContentMeta(quiz.practiceContentType);
    const attemptMode = selectiveMode ? "selective" : "practice";

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoAdvancing, setAutoAdvancing] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const isQuizActive = quiz.questions.length > 0 && !quiz.isComplete;
    const currentQuestion = quiz.questions[quiz.currentIndex];
    const currentQuestionAnswered = currentQuestion
        ? isQuestionAnswered(currentQuestion, quiz.answers)
        : false;

    // Extract specific primitives from the store so the effect doesn't restart on every quiz state change.
    // Using quiz (full object) as a dep would re-run this on every answer, nav, etc. — causing flicker on touch.
    const quizExamPaperId = quiz.examPaperId;
    const quizQuestionsLength = quiz.questions.length;
    const quizMode = quiz.mode;

    useEffect(() => {
        if (selectiveMode) {
            if (quizMode === "selective" && quizQuestionsLength > 0) {
                setLoading(false);
                return;
            }

            setError("Choose chapters before starting selective practice.");
            setLoading(false);
            return;
        }

        if (!quizId) {
            setError("Missing quiz id.");
            setLoading(false);
            return;
        }

        if (quizExamPaperId === Number(quizId) && quizQuestionsLength > 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Read non-subscribed store values inside the callback via getState() to avoid stale closures
        const { practiceContentType, courseId, setQuiz } = useQuizStore.getState();

        getExamQuestions(Number(quizId), "practice")
            .then((questions) => {
                if (questions.length === 0) {
                    setError(`This ${practiceContentType === "past_exam" ? "past exam" : "quiz"} has no questions yet.`);
                    return;
                }

                setQuiz(
                    questions,
                    "practice",
                    courseId ?? undefined,
                    Number(quizId)
                );
            })
            .catch(() => setError(`Failed to load ${practiceContentType === "past_exam" ? "past exam" : "quiz"} questions.`))
            .finally(() => setLoading(false));
    // Only re-run when the quiz ID changes or we switch modes — not on every quiz store update.
    }, [quizExamPaperId, quizQuestionsLength, quizMode, quizId, selectiveMode]);

    const handleSubmit = useCallback(async () => {
        if ((!quizId && !selectiveMode) || submitting) return;

        // Read live store values inside the callback — do NOT capture quiz in deps to avoid cascade re-renders
        const { questions, answers, completeQuiz } = useQuizStore.getState();

        setSubmitting(true);
        setAutoAdvancing(false);
        setError(null);

        try {
            const submissionAnswers = buildSubmissionAnswers(questions, answers);

            const result = await submitAttempt({
                exam_paper: selectiveMode ? undefined : Number(quizId),
                answers: Object.fromEntries(
                    Object.entries(submissionAnswers).map(([questionId, answer]) => [String(questionId), answer])
                ),
                mode: attemptMode,
                questions,
            });

            completeQuiz(result);
        } catch {
            const { questions: qs } = useQuizStore.getState();
            const fallbackSummary: AttemptSummary = {
                score: 0,
                percentage: 0,
                gradable_total: qs.length,
                pending_count: qs.filter((question) =>
                    ["essay", "matching"].includes(question.question_type ?? "")
                ).length,
                topic_breakdown: {},
                weak_topics: [],
            };

            completeQuiz(fallbackSummary);
        } finally {
            setSubmitting(false);
        }
    // No quiz object in deps — reads store via getState() to avoid the full-store re-subscription problem
    }, [attemptMode, quizId, selectiveMode, submitting]);

    useEffect(() => {
        if (quiz.isComplete) {
            navigate("/results", { replace: true });
        }
    }, [navigate, quiz.isComplete]);

    const quizCurrentIndex = quiz.currentIndex;
    const quizPracticeContentType = quiz.practiceContentType;
    useEffect(() => {
        if (
            !isQuizActive ||
            quizPracticeContentType !== "quiz" ||
            !currentQuestion ||
            !currentQuestionAnswered ||
            !isOptionQuestion(currentQuestion) ||
            submitting
        ) return;

        const isLast = quizCurrentIndex + 1 >= quizQuestionsLength;
        setAutoAdvancing(true);

        const timer = window.setTimeout(() => {
            if (isLast) {
                void handleSubmit();
                return;
            }

            useQuizStore.getState().nextQuestion();
            setAutoAdvancing(false);
        }, 550);

        return () => {
            window.clearTimeout(timer);
            setAutoAdvancing(false);
        };
    }, [
        handleSubmit,
        currentQuestion,
        currentQuestionAnswered,
        isQuizActive,
        quizCurrentIndex,
        quizQuestionsLength,
        quizPracticeContentType,
        submitting,
    ]);

    if (loading) {
        return (
            <div className="app-screen px-5 pt-12">
                <Skeleton className="mb-4 h-32 rounded-[32px]" />
                <Skeleton className="h-56 rounded-[32px]" />
            </div>
        );
    }

    if (error && !isQuizActive) {
        return (
            <div className="app-screen">
                <div className="app-topbar">
                    <div className="relative z-10">
                        <TopBackButton
                            onClick={() => navigate(selectiveMode ? "/quiz/selective" : "/quiz/list")}
                            label={selectiveMode ? "Chapters" : quiz.practiceContentType === "past_exam" ? "Past exams" : "Quiz list"}
                        />
                        <p className="app-section-label">{selectiveMode ? "Selective practice" : meta.sectionLabel}</p>
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                            Unable to start {selectiveMode ? "selective practice" : quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"}
                        </h1>
                    </div>
                </div>

                <div className="app-scroll app-scroll-compact">
                    <ErrorState message={error} onRetry={() => window.location.reload()} />
                </div>
            </div>
        );
    }

    const isLast = quiz.currentIndex + 1 >= quiz.questions.length;

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => setShowLeaveModal(true)}
                        label="Leave"
                        trailing={(
                            <span className="rounded-full bg-[#172B2F] px-3 py-2 text-xs font-bold text-white">
                                {quiz.currentIndex + 1}/{quiz.questions.length}
                            </span>
                        )}
                    />

                    <div className="app-sheet p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="app-section-label">{selectiveMode ? "Selective practice" : meta.attemptLabel}</p>
                                <p className="mt-2 text-sm font-semibold text-[#172B2F]">
                                    {selectiveMode ? quiz.courseName ?? "Selective Practice" : quiz.selectedQuizTitle ?? meta.attemptFallbackTitle}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-[#EAF4F1] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3F6F6A]">
                                        {quiz.questions.filter((question) => isQuestionAnswered(question, quiz.answers)).length}/{quiz.questions.length} answered
                                    </span>
                                    <span className="rounded-full bg-[#F4F8F5] px-3 py-1.5 text-[11px] font-semibold text-[#60728F]">
                                        {selectiveMode
                                            ? `${quiz.selectedTopics.length} chapters`
                                            : quiz.practiceContentType === "past_exam"
                                                ? "Mixed question styles supported"
                                                : "Tap once to continue"}
                                    </span>
                                </div>
                            </div>
                            <div className={`app-icon-chip ${quiz.practiceContentType === "past_exam" ? "bg-[#FFF6DF] text-[#B27614]" : "bg-[#EAF4F1] text-[#3F6F6A]"}`}>
                                {quiz.practiceContentType === "past_exam" ? <FileText size={18} /> : <Brain size={18} />}
                            </div>
                        </div>
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
                />
            </div>

            <div className="app-footer space-y-3">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={!currentQuestionAnswered || autoAdvancing}
                    style={{
                        backgroundColor: "#172B2F",
                        color: "#FFFFFF",
                        borderColor: "#172B2F",
                    }}
                    onClick={() => {
                        if (currentQuestion.question_type === "matching" && !Object.prototype.hasOwnProperty.call(quiz.answers, currentQuestion.id)) {
                            quiz.setAnswer("");
                        }

                        if (isLast) {
                            void handleSubmit();
                            return;
                        }

                        quiz.nextQuestion();
                    }}
                >
                    {submitting
                        ? `Submitting ${selectiveMode ? "selective practice" : quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"}`
                        : autoAdvancing
                            ? (isLast ? "Submitting automatically..." : "Loading next question...")
                            : isLast
                                ? `Submit ${selectiveMode ? "selective practice" : quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"}`
                                : "Next question"}
                </Button>
                <Button variant="ghost" size="md" fullWidth loading={submitting} onClick={() => void handleSubmit()}>
                    Finish now
                </Button>
            </div>

            <ConfirmDialog
                open={showLeaveModal}
                title="Leave this session?"
                description="Your current answers will be lost if you leave before submitting."
                confirmLabel="Leave session"
                cancelLabel="Stay here"
                onConfirm={() => {
                    setShowLeaveModal(false);
                    quiz.resetAttempt();
                    navigate(selectiveMode ? "/quiz/selective" : "/quiz/list");
                }}
                onCancel={() => setShowLeaveModal(false)}
            />
        </div>
    );
}
