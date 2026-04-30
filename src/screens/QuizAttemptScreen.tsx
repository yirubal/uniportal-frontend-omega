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

export default function QuizAttemptScreen() {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const quiz = useQuizStore();
    const meta = getPracticeContentMeta(quiz.practiceContentType);

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

    useEffect(() => {
        if (!quizId) {
            setError("Missing quiz id.");
            setLoading(false);
            return;
        }

        if (quiz.examPaperId === Number(quizId) && quiz.questions.length > 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        getExamQuestions(Number(quizId), "practice")
            .then((questions) => {
                if (questions.length === 0) {
                    setError(`This ${quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"} has no questions yet.`);
                    return;
                }

                quiz.setQuiz(
                    questions,
                    "practice",
                    quiz.courseId ?? undefined,
                    Number(quizId)
                );
            })
            .catch(() => setError(`Failed to load ${quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"} questions.`))
            .finally(() => setLoading(false));
    }, [quiz, quizId]);

    const handleSubmit = useCallback(async () => {
        if (!quizId || submitting) return;

        setSubmitting(true);
        setAutoAdvancing(false);
        setError(null);

        try {
            const submissionAnswers = buildSubmissionAnswers(quiz.questions, quiz.answers);

            const result = await submitAttempt({
                exam_paper: Number(quizId),
                answers: Object.fromEntries(
                    Object.entries(submissionAnswers).map(([questionId, answer]) => [String(questionId), answer])
                ),
                mode: "practice",
            });

            quiz.completeQuiz(result);
        } catch {
            const fallbackSummary: AttemptSummary = {
                score: 0,
                percentage: 0,
                gradable_total: quiz.questions.length,
                pending_count: quiz.questions.filter((question) =>
                    ["essay", "matching"].includes(question.question_type ?? "")
                ).length,
                topic_breakdown: {},
                weak_topics: [],
            };

            quiz.completeQuiz(fallbackSummary);
        } finally {
            setSubmitting(false);
        }
    }, [quiz, quizId, submitting]);

    useEffect(() => {
        if (quiz.isComplete) {
            navigate("/results", { replace: true });
        }
    }, [navigate, quiz.isComplete]);

    useEffect(() => {
        if (
            !isQuizActive ||
            quiz.practiceContentType !== "quiz" ||
            !currentQuestion ||
            !currentQuestionAnswered ||
            !isOptionQuestion(currentQuestion) ||
            submitting
        ) return;

        const isLast = quiz.currentIndex + 1 >= quiz.questions.length;
        setAutoAdvancing(true);

        const timer = window.setTimeout(() => {
            if (isLast) {
                void handleSubmit();
                return;
            }

            quiz.nextQuestion();
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
        quiz,
        quiz.currentIndex,
        quiz.questions.length,
        quiz.practiceContentType,
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
                            onClick={() => navigate("/quiz/list")}
                            label={quiz.practiceContentType === "past_exam" ? "Past exams" : "Quiz list"}
                        />
                        <p className="app-section-label">{meta.sectionLabel}</p>
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                            Unable to start {quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"}
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
                                <p className="app-section-label">{meta.attemptLabel}</p>
                                <p className="mt-2 text-sm font-semibold text-[#172B2F]">
                                    {quiz.selectedQuizTitle ?? meta.attemptFallbackTitle}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-[#EAF4F1] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3F6F6A]">
                                        {quiz.questions.filter((question) => isQuestionAnswered(question, quiz.answers)).length}/{quiz.questions.length} answered
                                    </span>
                                    <span className="rounded-full bg-[#F4F8F5] px-3 py-1.5 text-[11px] font-semibold text-[#60728F]">
                                        {quiz.practiceContentType === "past_exam"
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
                        ? `Submitting ${quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"}`
                        : autoAdvancing
                            ? (isLast ? "Submitting automatically..." : "Loading next question...")
                            : isLast
                                ? `Submit ${quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"}`
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
                    navigate("/quiz/list");
                }}
                onCancel={() => setShowLeaveModal(false)}
            />
        </div>
    );
}
