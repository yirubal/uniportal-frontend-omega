import { ArrowLeft, BookOpenCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnswerReviewModal from "../components/AnswerReviewModal";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { useQuizStore } from "../store/quizStore";
import { getScoreEmoji, getScoreMessage } from "../utils/format";
import { getPracticeContentMeta } from "../utils/practice";

export default function ResultsScreen() {
    const navigate = useNavigate();
    const { attemptSummary, answers, courseId, examPaperId, mode, practiceContentType, questions, resetAttempt } = useQuizStore();
    const [showReview, setShowReview] = useState(false);
    const meta = getPracticeContentMeta(practiceContentType);

    const percentage = Math.round(
        attemptSummary?.percentage ??
        (attemptSummary?.gradable_total
            ? (attemptSummary.score / attemptSummary.gradable_total) * 100
            : 0)
    );
    const emoji = getScoreEmoji(percentage);
    const message = getScoreMessage(percentage);
    const passed = percentage >= 50;
    const canReview = Boolean(attemptSummary && (questions.length > 0 || Object.keys(attemptSummary.detailed_answers ?? {}).length > 0));
    const circumference = 2 * Math.PI * 40;
    const dashOffset = circumference - (percentage / 100) * circumference;

    const handleRetry = () => {
        resetAttempt();

        if (mode === "simulation" && examPaperId) {
            navigate(`/simulate/${examPaperId}`, { replace: true });
            return;
        }

        if (courseId) {
            navigate("/quiz/list", { replace: true });
            return;
        }

        navigate("/quiz", { replace: true });
    };

    const handleExit = () => {
        if (mode === "simulation") {
            navigate("/exit-exam", { replace: true });
            return;
        }

        navigate("/quiz/setup", { replace: true });
    };

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Assessment complete</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">
                        {mode === "simulation" ? "Simulation summary" : meta.resultsSummaryLabel}
                    </h1>
                    <p className="mt-2 text-sm text-[#526B70]">
                        Review the score, pending items, and weak topics from the submitted attempt.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet px-5 py-6 text-center">
                    <div className="mx-auto relative h-32 w-32">
                        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#E8EDF6" strokeWidth="8" />
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={percentage >= 60 ? "#2E9E73" : "#D95A50"}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl">{emoji}</span>
                            <span className="mt-1 text-xl font-black text-[#172B2F]">{percentage}%</span>
                        </div>
                    </div>

                    <p className="mt-5 text-xl font-bold text-[#172B2F]">{message}</p>
                    <div className={`mx-auto mt-3 inline-flex min-h-9 items-center justify-center rounded-full px-4 py-2 text-sm font-black ${passed ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                        {passed ? "Passed" : "Needs more practice"}
                    </div>
                    <p className="mt-2 text-sm text-[#526B70]">
                        Auto-graded score across {attemptSummary?.gradable_total ?? 0} gradable questions
                    </p>

                    <div className="mt-6 app-grid-2">
                        <ResultStat label="Gradable" value={attemptSummary?.gradable_total ?? 0} tone="tone-green" />
                        <ResultStat label="Not graded" value={attemptSummary?.pending_count ?? 0} tone="tone-gold" />
                    </div>
                </div>

                {!!attemptSummary && Object.keys(attemptSummary.topic_breakdown).length > 0 && (
                    <div className="mt-5">
                        <p className="app-section-label mb-3">Topic breakdown</p>
                        <div className="space-y-3">
                            {Object.entries(attemptSummary.topic_breakdown).map(([topic, score]) => (
                                <div key={topic} className="app-list-item">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold leading-relaxed text-[#172B2F]">
                                            {topic}
                                        </p>
                                        <p className="mt-2 text-xs text-[#70868B]">
                                            {score}% topic score
                                        </p>
                                    </div>
                                    <span className={`app-badge ${score >= 60 ? "app-badge-green" : "app-badge-coral"} !px-3 !py-2 !text-[0.68rem]`}>
                                        {score}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!!attemptSummary?.weak_topics.length && (
                    <div className="mt-5 app-sheet p-4">
                        <p className="app-section-label">Weak topics</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {attemptSummary.weak_topics.map((topic) => (
                                <span key={topic} className="app-badge app-badge-gold !px-3 !py-2 !text-[0.7rem]">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="app-footer space-y-3">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => setShowReview(true)}
                    disabled={!canReview}
                    style={{
                        backgroundColor: "#172B2F",
                        color: "#FFFFFF",
                        borderColor: "#172B2F",
                    }}
                >
                    <BookOpenCheck size={16} />
                    Review Answers
                </Button>
                <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={handleRetry}
                >
                    <RotateCcw size={16} />
                    {mode === "simulation" ? "Try again" : meta.resultsRetryLabel}
                </Button>
                <Button variant="ghost" size="md" fullWidth onClick={handleExit}>
                    <ArrowLeft size={16} />
                    {mode === "simulation" ? "Back to Exams" : "Back to Courses"}
                </Button>
            </div>

            {showReview && attemptSummary && (
                <AnswerReviewModal
                    attempt={attemptSummary}
                    questions={questions}
                    answers={answers}
                    onClose={() => setShowReview(false)}
                />
            )}
        </div>
    );
}

function ResultStat({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className={`app-stat-card rounded-[24px] ${tone}`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</p>
        </div>
    );
}
