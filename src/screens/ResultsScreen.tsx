import { useNavigate } from "react-router-dom";
import { useQuizStore } from "../store/quizStore";
import { getScoreEmoji, getScoreMessage } from "../utils/format";
import Button from "../components/ui/Button";

export default function ResultsScreen() {
    const navigate = useNavigate();
    const { score, results, questions, resetQuiz } = useQuizStore();

    const total = questions.length || results.length || 1;
    const percentage = Math.round((score / total) * 100);
    const emoji = getScoreEmoji(percentage);
    const message = getScoreMessage(percentage);

    const handleRetry = () => {
        resetQuiz();
        navigate("/quiz", { replace: true });
    };

    const circumference = 2 * Math.PI * 40; // r=40
    const dashOffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="fixed inset-0 flex flex-col bg-[#F5F7FA]">
            {/* Header */}
            <div className="bg-[#0A1628] px-5 pt-12 pb-5">
                <h1 className="text-white text-xl font-bold">Quiz Complete</h1>
                <p className="text-[#8899AA] text-sm mt-0.5">Here's how you did</p>
            </div>

            <div className="flex-1 overflow-y-auto pb-28">
                {/* Score card */}
                <div className="mx-5 mt-5 bg-white rounded-3xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] flex flex-col items-center">
                    {/* Circular progress */}
                    <div className="relative w-28 h-28 mb-4">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="#F0F0F0"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke={percentage >= 60 ? "#4CAF50" : "#F44336"}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                className="transition-all duration-700"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-[#0A1628]">{percentage}%</span>
                        </div>
                    </div>

                    <span className="text-4xl mb-2">{emoji}</span>
                    <h2 className="text-lg font-bold text-[#0A1628]">{message}</h2>
                    <p className="text-[#999] text-sm mt-1">
                        {score} correct out of {total} questions
                    </p>

                    {/* Stats row */}
                    <div className="flex gap-6 mt-5 pt-5 border-t border-[#F0F0F0] w-full justify-center">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-[#4CAF50]">{score}</span>
                            <span className="text-[#999] text-xs mt-0.5">Correct</span>
                        </div>
                        <div className="w-px bg-[#F0F0F0]" />
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-[#F44336]">{total - score}</span>
                            <span className="text-[#999] text-xs mt-0.5">Wrong</span>
                        </div>
                        <div className="w-px bg-[#F0F0F0]" />
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-black text-[#0A1628]">{total}</span>
                            <span className="text-[#999] text-xs mt-0.5">Total</span>
                        </div>
                    </div>
                </div>

                {/* Per-question review */}
                {results.length > 0 && (
                    <div className="px-5 mt-5">
                        <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-3">
                            Question Review
                        </p>
                        <div className="flex flex-col gap-3">
                            {results.map((r, i) => (
                                <div
                                    key={r.question.id}
                                    className={`bg-white rounded-2xl p-4 border-l-4 shadow-[0_1px_8px_rgba(0,0,0,0.05)] ${
                                        r.is_correct ? "border-[#4CAF50]" : "border-[#F44336]"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`text-lg flex-shrink-0 ${r.is_correct ? "" : ""}`}>
                                            {r.is_correct ? "✅" : "❌"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[#0A1628] text-sm font-semibold leading-snug">
                                                {i + 1}. {r.question.text}
                                            </p>
                                            <p className="text-[#999] text-xs mt-1.5">
                                                Your answer:{" "}
                                                <span className={`font-semibold ${r.is_correct ? "text-[#4CAF50]" : "text-[#F44336]"}`}>
                                                    {r.selected_option.toUpperCase()}
                                                </span>
                                                {!r.is_correct && r.question.correct_option && (
                                                    <span className="text-[#555]">
                                                        {" "}· Correct:{" "}
                                                        <span className="font-semibold text-[#4CAF50]">
                                                            {r.question.correct_option.toUpperCase()}
                                                        </span>
                                                    </span>
                                                )}
                                            </p>
                                            {r.question.explanation && (
                                                <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-3 mt-2">
                                                    <p className="text-[10px] font-bold text-[#F57F17] mb-1">💡 Explanation</p>
                                                    <p className="text-xs text-[#555] leading-relaxed">
                                                        {r.question.explanation}
                                                    </p>
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

            {/* Action buttons */}
            <div className="px-5 pb-10 pt-3 bg-[#F5F7FA] border-t border-[#EAEAEA] flex flex-col gap-2">
                <Button variant="primary" size="lg" fullWidth onClick={handleRetry}>
                    Try Another Quiz 🧠
                </Button>
                <Button variant="ghost" size="md" fullWidth onClick={() => navigate("/home")}>
                    Back to Home
                </Button>
            </div>
        </div>
    );
}
