import { Question } from "../store/quizStore";
import { useTelegram } from "../hooks/useTelegram";

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    selectedOption: "a" | "b" | "c" | "d" | null;
    showExplanation: boolean;
    onSelect: (option: "a" | "b" | "c" | "d") => void;
    // In simulation mode we don't reveal correct answer until end
    simulationMode?: boolean;
}

const OPTIONS = ["a", "b", "c", "d"] as const;
const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuestionCard({
                                         question,
                                         questionNumber,
                                         totalQuestions,
                                         selectedOption,
                                         showExplanation,
                                         onSelect,
                                         simulationMode = false,
                                     }: QuestionCardProps) {
    const { haptic } = useTelegram();

    const getOptionText = (option: typeof OPTIONS[number]): string => {
        const map: Record<typeof OPTIONS[number], string> = {
            a: question.option_a,
            b: question.option_b,
            c: question.option_c,
            d: question.option_d,
        };
        return map[option];
    };

    const getOptionStyle = (
        option: typeof OPTIONS[number]
    ): { border: string; bg: string; text: string; labelBg: string } => {
        // Not answered yet
        if (selectedOption === null) {
            return {
                border: "#E0E0E0",
                bg: "#FFFFFF",
                text: "#333333",
                labelBg: "#F5F5F5",
            };
        }

        // Simulation mode — just highlight selected, no right/wrong
        if (simulationMode) {
            if (option === selectedOption) {
                return {
                    border: "#0A1628",
                    bg: "#F0F4FF",
                    text: "#0A1628",
                    labelBg: "#0A1628",
                };
            }
            return {
                border: "#E0E0E0",
                bg: "#FFFFFF",
                text: "#333333",
                labelBg: "#F5F5F5",
            };
        }

        // Practice mode — show correct / wrong
        const isCorrect = option === question.correct_option;
        const isSelected = option === selectedOption;

        if (isCorrect) {
            return {
                border: "#4CAF50",
                bg: "#E8F5E9",
                text: "#1B5E20",
                labelBg: "#4CAF50",
            };
        }
        if (isSelected && !isCorrect) {
            return {
                border: "#F44336",
                bg: "#FFEBEE",
                text: "#B71C1C",
                labelBg: "#F44336",
            };
        }
        return {
            border: "#E0E0E0",
            bg: "#FFFFFF",
            text: "#999999",
            labelBg: "#F5F5F5",
        };
    };

    const handleSelect = (option: typeof OPTIONS[number]) => {
        if (selectedOption !== null) return; // Already answered
        haptic.medium();
        onSelect(option);
    };

    const progressPercent = ((questionNumber - 1) / totalQuestions) * 100;

    return (
        <div className="flex flex-col gap-4">
            {/* Progress */}
            <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#999]">
          Question {questionNumber} of {totalQuestions}
        </span>
                {!simulationMode && selectedOption && (
                    <span
                        className={`text-xs font-bold ${
                            selectedOption === question.correct_option
                                ? "text-[#4CAF50]"
                                : "text-[#F44336]"
                        }`}
                    >
            {selectedOption === question.correct_option ? "✓ Correct" : "✗ Wrong"}
          </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#FFB400] rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Question */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
                <p className="text-base font-semibold text-[#1A1A1A] leading-relaxed">
                    {question.text}
                </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
                {OPTIONS.map((option, index) => {
                    const style = getOptionStyle(option);
                    const isAnswered = selectedOption !== null;

                    return (
                        <button
                            key={option}
                            onClick={() => handleSelect(option)}
                            disabled={isAnswered}
                            className="flex items-center gap-3 p-3.5 rounded-xl
                         text-left transition-all duration-200
                         active:scale-[0.98] disabled:cursor-default"
                            style={{
                                border: `2px solid ${style.border}`,
                                backgroundColor: style.bg,
                            }}
                        >
                            {/* Option label */}
                            <span
                                className="w-7 h-7 rounded-full flex items-center justify-center
                           text-xs font-bold flex-shrink-0 transition-colors duration-200"
                                style={{
                                    backgroundColor:
                                        isAnswered && !simulationMode
                                            ? style.labelBg
                                            : style.labelBg,
                                    color:
                                        isAnswered &&
                                        !simulationMode &&
                                        (option === question.correct_option ||
                                            option === selectedOption)
                                            ? "#FFFFFF"
                                            : "#666666",
                                }}
                            >
                {OPTION_LABELS[index]}
              </span>

                            {/* Option text */}
                            <span
                                className="text-sm font-medium flex-1"
                                style={{ color: style.text }}
                            >
                {getOptionText(option)}
              </span>
                        </button>
                    );
                })}
            </div>

            {/* Explanation */}
            {showExplanation && !simulationMode && question.explanation && (
                <div
                    className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl
                     p-4 animate-fade-in-up"
                >
                    <p className="text-xs font-bold text-[#F57F17] mb-1.5">
                        💡 Explanation
                    </p>
                    <p className="text-sm text-[#555] leading-relaxed">
                        {question.explanation}
                    </p>
                </div>
            )}
        </div>
    );
}