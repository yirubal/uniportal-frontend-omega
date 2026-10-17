import { Brain, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getExamQuestions } from "../api/quiz";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAttemptSubmit } from "../hooks/useAttemptSubmit";
import ConfirmDialog from "../components/ConfirmDialog";
import UnansweredConfirmDialog from "../components/UnansweredConfirmDialog";
import QuestionCard from "../components/QuestionCard";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { useShallow } from "zustand/react/shallow";
import { useQuizStore } from "../store/quizStore";
import { getPracticeContentMeta } from "../utils/practice";
import { isOptionQuestion, isQuestionAnswered } from "../utils/questions";

export default function QuizAttemptScreen({ selectiveMode = false }: { selectiveMode?: boolean }) {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const quiz = useQuizStore(
        useShallow((state) => ({
            answers: state.answers,
            attemptSummary: state.attemptSummary,
            courseName: state.courseName,
            currentIndex: state.currentIndex,
            examPaperId: state.examPaperId,
            isComplete: state.isComplete,
            mode: state.mode,
            nextQuestion: state.nextQuestion,
            practiceContentType: state.practiceContentType,
            questions: state.questions,
            resetAttempt: state.resetAttempt,
            selectedAnswer: state.selectedAnswer,
            selectedQuizTitle: state.selectedQuizTitle,
            selectedTopics: state.selectedTopics,
            setAnswer: state.setAnswer,
            setSelectedQuiz: state.setSelectedQuiz,
        }))
    );
    const meta = getPracticeContentMeta(quiz.practiceContentType);
    const attemptMode = selectiveMode ? "selective" : "practice";

    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);

    const isQuizActive = quiz.questions.length > 0 && !quiz.isComplete;
    const currentQuestion = quiz.questions[quiz.currentIndex];
    const currentQuestionAnswered = currentQuestion
        ? isQuestionAnswered(currentQuestion, quiz.answers)
        : false;
    const contentLabel = quiz.practiceContentType === "past_exam" ? "past exam" : "quiz";

    // Reuse the stored attempt for this paper (e.g. after a reload); otherwise fetch it.
    // A finished attempt is never refetched: Router navigations run in a transition, so this screen stays
    // mounted while the lazy Results screen loads, and a refetch would reset the store under it.
    // Every way into a retake (quiz list, "Try again", Performance) resets the attempt first.
    const paperId = Number(quizId);
    const hasStoredAttempt = quiz.examPaperId === paperId && quiz.questions.length > 0;
    const needsQuestions = !selectiveMode && Boolean(paperId) && !hasStoredAttempt;
    const showsFinishedAttempt = quiz.isComplete && quiz.attemptSummary !== null &&
        (selectiveMode ? quiz.mode === "selective" : quiz.examPaperId === paperId);
    const questionsLoad = useAsyncData(
        needsQuestions ? String(paperId) : null,
        (signal) => getExamQuestions(paperId, "practice", { signal })
    );
    const loadedQuestions = questionsLoad.data;

    useEffect(() => {
        if (!loadedQuestions?.length) return;
        // Read non-subscribed store values here to avoid stale closures.
        const { courseId, setQuiz } = useQuizStore.getState();
        setQuiz(loadedQuestions, "practice", courseId ?? undefined, paperId);
    }, [loadedQuestions, paperId]);

    // Still loading while fetched questions are on their way into the store (one render after they arrive).
    const loading = questionsLoad.loading || (needsQuestions && Boolean(loadedQuestions?.length));
    const error = selectiveMode
        ? (quiz.mode === "selective" && isQuizActive ? null : "Choose chapters before starting selective practice.")
        : !paperId
            ? "Missing quiz id."
            : questionsLoad.error
                ? `Failed to load ${contentLabel} questions.`
                : loadedQuestions && loadedQuestions.length === 0
                    ? `This ${contentLabel} has no questions yet.`
                    : null;

    const { submit, submitting, submitError } = useAttemptSubmit({
        examPaperId: selectiveMode ? undefined : Number(quizId),
        mode: attemptMode,
        includeQuestions: true,
        fallbackError: "Failed to submit your answers.",
    });

    const handleSubmit = useCallback(async () => {
        if (!quizId && !selectiveMode) return;
        await submit();
    }, [quizId, selectiveMode, submit]);

    // Quizzes move on by themselves once an option is picked. Derived rather than stored, so it turns
    // off as soon as the question changes, a submit starts, or a submit fails (retry is manual).
    const autoAdvancing = Boolean(
        isQuizActive &&
        quiz.practiceContentType === "quiz" &&
        currentQuestion &&
        currentQuestionAnswered &&
        isOptionQuestion(currentQuestion) &&
        !submitting &&
        !submitError
    );
    const quizCurrentIndex = quiz.currentIndex;
    const quizQuestionsLength = quiz.questions.length;

    useEffect(() => {
        if (!autoAdvancing) return;

        const isLast = quizCurrentIndex + 1 >= quizQuestionsLength;
        const timer = window.setTimeout(() => {
            if (isLast) {
                void handleSubmit();
                return;
            }
            useQuizStore.getState().nextQuestion();
        }, 550);

        return () => window.clearTimeout(timer);
    }, [autoAdvancing, handleSubmit, quizCurrentIndex, quizQuestionsLength]);

    if (showsFinishedAttempt) {
        return <Navigate to="/results" replace />;
    }

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
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-ink">
                            Unable to start {selectiveMode ? "selective practice" : quiz.practiceContentType === "past_exam" ? "past exam" : "quiz"}
                        </h1>
                    </div>
                </div>

                <div className="app-scroll app-scroll-compact">
                    <ErrorState
                        message={error}
                        // Selective practice can only restart from chapter selection; papers can refetch.
                        onRetry={() => (selectiveMode ? navigate("/quiz/selective") : questionsLoad.reload())}
                    />
                </div>
            </div>
        );
    }

    const isLast = quiz.currentIndex + 1 >= quiz.questions.length;
    const answeredCount = quiz.questions.filter((question) => isQuestionAnswered(question, quiz.answers)).length;
    const unansweredCount = quiz.questions.length - answeredCount;

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => setShowLeaveModal(true)}
                        label="Leave"
                        trailing={(
                            <span className="rounded-full bg-fill px-3 py-2 text-xs font-bold text-white">
                                {quiz.currentIndex + 1}/{quiz.questions.length}
                            </span>
                        )}
                    />

                    <div className="app-sheet p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="app-section-label">{selectiveMode ? "Selective practice" : meta.attemptLabel}</p>
                                <p className="mt-2 text-sm font-semibold text-ink">
                                    {selectiveMode ? quiz.courseName ?? "Selective Practice" : quiz.selectedQuizTitle ?? meta.attemptFallbackTitle}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                                        {answeredCount}/{quiz.questions.length} answered
                                    </span>
                                    <span className="rounded-full bg-mist px-3 py-1.5 text-[11px] font-semibold text-steel">
                                        {selectiveMode
                                            ? `${quiz.selectedTopics.length} chapters`
                                            : quiz.practiceContentType === "past_exam"
                                                ? "Mixed question styles supported"
                                                : "Tap once to continue"}
                                    </span>
                                </div>
                            </div>
                            <div className={`app-icon-chip ${quiz.practiceContentType === "past_exam" ? "bg-gold-tint text-gold-ink" : "bg-accent-soft text-accent"}`}>
                                {quiz.practiceContentType === "past_exam" ? <FileText size={18} /> : <Brain size={18} />}
                            </div>
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
                    onSelect={quiz.setAnswer}
                />
            </div>

            <div className="app-footer space-y-3">
                {submitError && (
                    <div role="alert" className="rounded-[16px] border border-bad-line bg-coral-soft px-4 py-3 text-sm leading-relaxed text-bad-ink">
                        Your answers were not submitted: {submitError} Tap submit to try again.
                    </div>
                )}
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={(!currentQuestionAnswered && !(isLast && submitError)) || autoAdvancing || submitting}
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
                <Button
                    variant="ghost"
                    size="md"
                    fullWidth
                    loading={submitting}
                    onClick={() => (unansweredCount > 0 ? setShowFinishConfirm(true) : void handleSubmit())}
                >
                    Finish now
                </Button>
            </div>

            <UnansweredConfirmDialog
                open={showFinishConfirm}
                unansweredCount={unansweredCount}
                onConfirm={() => {
                    setShowFinishConfirm(false);
                    void handleSubmit();
                }}
                onCancel={() => setShowFinishConfirm(false)}
            />

            <ConfirmDialog
                open={showLeaveModal}
                title="Leave this session?"
                description="Your current answers will be lost if you leave before submitting."
                confirmLabel="Leave session"
                cancelLabel="Stay here"
                onConfirm={() => {
                    setShowLeaveModal(false);
                    const { selectedQuizId: leftQuizId, selectedQuizTitle: leftQuizTitle } = useQuizStore.getState();
                    quiz.resetAttempt();
                    // Keep the paper selected so the list highlights the one just left.
                    if (!selectiveMode && leftQuizId && leftQuizTitle) quiz.setSelectedQuiz(leftQuizId, leftQuizTitle);
                    navigate(selectiveMode ? "/quiz/selective" : "/quiz/list");
                }}
                onCancel={() => setShowLeaveModal(false)}
            />
        </div>
    );
}
