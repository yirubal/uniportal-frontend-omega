import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamPapers, getExamQuestions, submitAttempt, type ExamPaper } from "../api/quiz";
import QuestionCard from "../components/QuestionCard";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui";
import { useQuizStore } from "../store/quizStore";
import { formatDuration, formatTimeRemaining } from "../utils/format";

export default function SimulationScreen() {
    const navigate = useNavigate();
    const { examId } = useParams();
    const quiz = useQuizStore();

    const [exam, setExam] = useState<ExamPaper | null>(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const answeredCount = useMemo(() => Object.keys(quiz.answers).length, [quiz.answers]);

    const handleStart = async () => {
        if (!exam) return;

        setStarting(true);
        setError(null);

        try {
            const questions = await getExamQuestions(exam.id);
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
                    Object.entries(quiz.answers).map(([questionId, selected]) => [String(questionId), selected])
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
                        <TopBackButton onClick={() => navigate("/exit-exam")} />
                        <p className="app-section-label">Simulation</p>
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
                            <li>The timer runs continuously once the simulation starts.</li>
                            <li>Unanswered questions lower the final auto-graded score.</li>
                        </ul>
                    </div>

                    {error && <ErrorState message={error} />}
                </div>

                <div className="app-footer">
                    <Button variant="primary" size="lg" fullWidth loading={starting} onClick={() => void handleStart()}>
                        Start timed simulation
                    </Button>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[quiz.currentIndex];
    const isLast = quiz.currentIndex + 1 >= quiz.questions.length;

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => navigate("/exit-exam")}
                        label="Leave"
                        trailing={(
                            <span className={`rounded-full px-3 py-2 text-xs font-bold ${(quiz.timeRemaining ?? 0) < 300 ? "bg-[#FFF0ED] text-[#D95A50]" : "bg-[#18253D] text-white"}`}>
                                {formatTimeRemaining(quiz.timeRemaining ?? 0)}
                            </span>
                        )}
                    />

                    <div className="mt-2 app-grid-2">
                        <InfoTile label="Progress" value={`${quiz.currentIndex + 1}/${quiz.questions.length}`} />
                        <InfoTile label="Answered" value={`${answeredCount}/${quiz.questions.length}`} />
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
                />
            </div>

            <div className="app-footer space-y-3">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
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
