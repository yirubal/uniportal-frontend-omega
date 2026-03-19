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
            const answers = Object.entries(quiz.answers).map(([questionId, selected]) => ({
                question_id: Number(questionId),
                selected_option: selected as "a" | "b" | "c" | "d",
            }));

            const result = await submitAttempt({
                exam_paper_id: exam.id,
                answers,
                mode: "simulation",
            });

            quiz.completeQuiz(result.score, result.results);
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
                <div className="app-hero">
                    <div className="relative z-10">
                        <TopBackButton onClick={() => navigate("/exit-exam")} />
                        <p className="app-section-label text-white/70">Simulation</p>
                        <h1 className="app-title mt-2 text-[2rem] font-bold text-white">{exam?.title}</h1>
                        <p className="mt-3 text-sm leading-relaxed text-white/72">
                            A timed mock exam flow with enough breathing room to reduce scanning fatigue before you start.
                        </p>
                    </div>
                </div>

                <div className="app-scroll app-scroll-tight space-y-4">
                    <div className="app-grid-2">
                        <InfoTile label="Questions" value={exam?.total_questions ?? 0} />
                        <InfoTile label="Duration" value={formatDuration(exam?.duration_minutes ?? 0)} />
                    </div>

                    <div className="app-panel rounded-[32px] p-5">
                        <p className="app-section-label">Simulation rules</p>
                        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#53627D]">
                            <li>Answers are hidden until submission.</li>
                            <li>The timer runs continuously once you begin.</li>
                            <li>Unanswered questions count as incorrect.</li>
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
            <div className="app-hero">
                <div className="relative z-10">
                    <TopBackButton
                        onClick={() => navigate("/exit-exam")}
                        label="Leave"
                        trailing={(
                            <span className={`rounded-full px-3 py-2 text-xs font-bold ${(quiz.timeRemaining ?? 0) < 300 ? "bg-[#FFF0ED] text-[#D95A50]" : "bg-white/12 text-white"}`}>
                                {formatTimeRemaining(quiz.timeRemaining ?? 0)}
                            </span>
                        )}
                    />

                    <div className="mt-5 app-grid-2">
                        <div className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
                            <p className="app-section-label text-white/60">Progress</p>
                            <p className="mt-2 text-base font-semibold text-white">
                                {quiz.currentIndex + 1}/{quiz.questions.length}
                            </p>
                        </div>
                        <div className="rounded-[24px] bg-white/10 p-4 backdrop-blur">
                            <p className="app-section-label text-white/60">Answered</p>
                            <p className="mt-2 text-base font-semibold text-white">
                                {answeredCount}/{quiz.questions.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="app-scroll app-scroll-tight">
                <QuestionCard
                    question={currentQuestion}
                    questionNumber={quiz.currentIndex + 1}
                    totalQuestions={quiz.questions.length}
                    selectedOption={quiz.selectedOption}
                    showExplanation={false}
                    onSelect={(option) => quiz.setAnswer(option)}
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
        <div className="app-panel rounded-[28px] p-4">
            <p className="app-section-label">{label}</p>
            <p className="mt-2 text-lg font-black text-[#18253D]">{value}</p>
        </div>
    );
}
