import { ArrowLeft, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { useQuizStore } from "../store/quizStore";
import { getScoreEmoji, getScoreMessage } from "../utils/format";

export default function ResultsScreen() {
    const navigate = useNavigate();
    const { score, results, questions, resetQuiz } = useQuizStore();

    const total = questions.length || results.length || 1;
    const percentage = Math.round((score / total) * 100);
    const emoji = getScoreEmoji(percentage);
    const message = getScoreMessage(percentage);
    const circumference = 2 * Math.PI * 40;
    const dashOffset = circumference - (percentage / 100) * circumference;

    const handleRetry = () => {
        resetQuiz();
        navigate("/quiz", { replace: true });
    };

    return (
        <div className="app-screen">
            <div className="app-hero">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label text-white/70">Assessment complete</p>
                    <h1 className="app-title mt-2 text-[2rem] font-bold text-white">
                        Your results are ready
                    </h1>
                    <p className="mt-3 text-sm text-white/72">
                        Review the score, then scan question feedback while the session is still fresh.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-tight">
                <div className="app-panel rounded-[34px] px-5 py-6 text-center">
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
                            <span className="mt-1 text-xl font-black text-[#18253D]">{percentage}%</span>
                        </div>
                    </div>

                    <p className="mt-5 text-xl font-bold text-[#18253D]">{message}</p>
                    <p className="mt-2 text-sm text-[#53627D]">
                        {score} correct out of {total} questions
                    </p>

                    <div className="mt-6 app-grid-2">
                        <ResultStat label="Correct" value={score} tone="tone-green" />
                        <ResultStat label="Incorrect" value={total - score} tone="tone-coral" />
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="mt-5">
                        <p className="app-section-label mb-3">Question review</p>
                        <div className="space-y-3">
                            {results.map((item, index) => (
                                <div key={item.question.id} className="app-panel rounded-[28px] p-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${item.is_correct ? "bg-[#EAF8F1] text-[#2E9E73]" : "bg-[#FFF0ED] text-[#D95A50]"}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold leading-relaxed text-[#18253D]">
                                                {item.question.text}
                                            </p>
                                            <p className="mt-2 text-xs text-[#7F8CA5]">
                                                Your answer: <span className="font-semibold text-[#18253D]">{item.selected_option.toUpperCase()}</span>
                                                {!item.is_correct && item.question.correct_option && (
                                                    <>
                                                        {" · "}Correct: <span className="font-semibold text-[#2E9E73]">{item.question.correct_option.toUpperCase()}</span>
                                                    </>
                                                )}
                                            </p>
                                            {item.question.explanation && (
                                                <div className="mt-3 rounded-[22px] bg-[#FFF6DF] px-4 py-3 text-sm leading-relaxed text-[#6C5521]">
                                                    {item.question.explanation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="app-footer space-y-3">
                <Button variant="primary" size="lg" fullWidth onClick={handleRetry}>
                    <RotateCcw size={16} />
                    Try another quiz
                </Button>
                <Button variant="ghost" size="md" fullWidth onClick={() => navigate("/home")}>
                    <ArrowLeft size={16} />
                    Back to home
                </Button>
            </div>
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
