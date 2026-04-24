import { useEffect, useState } from "react";
import { Question } from "../store/quizStore";
import { useTelegram } from "../hooks/useTelegram";

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    selectedAnswer: string | null;
    onSelect: (answer: string) => void;
    simulationMode?: boolean;
}

const OPTION_LABELS: Record<string, string> = {
    a: "A",
    b: "B",
    c: "C",
    d: "D",
    e: "E",
};

export default function QuestionCard({
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onSelect,
    simulationMode = false,
}: QuestionCardProps) {
    const { haptic } = useTelegram();
    const [draftAnswer, setDraftAnswer] = useState(selectedAnswer ?? "");
    const [showHint, setShowHint] = useState(false);
    const optionKeys = getOptionKeys(question);
    const isTextQuestion = isFreeTextQuestion(question.question_type);

    useEffect(() => {
        setDraftAnswer(selectedAnswer ?? "");
        setShowHint(false);
    }, [question.id, selectedAnswer]);

    const getOptionText = (option: string): string => {
        const map: Record<string, string | undefined> = {
            a: question.option_a,
            b: question.option_b,
            c: question.option_c,
            d: question.option_d,
            e: question.option_e,
        };
        return map[option] ?? "";
    };

    const getOptionStyle = (option: string): { border: string; bg: string; text: string; labelBg: string } => {
        if (selectedAnswer === null) {
            return {
                border: "rgba(31, 53, 91, 0.08)",
                bg: "rgba(239, 244, 249, 0.9)",
                text: "#18253D",
                labelBg: "rgba(224, 232, 241, 0.95)",
            };
        }

        if (option === selectedAnswer) {
            return {
                border: "#0A1628",
                bg: simulationMode ? "#DDE6F2" : "#E5ECF6",
                text: "#0A1628",
                labelBg: "#0A1628",
            };
        }
        return {
            border: "rgba(31, 53, 91, 0.08)",
            bg: "rgba(239, 244, 249, 0.72)",
            text: "#4D607F",
            labelBg: "rgba(224, 232, 241, 0.95)",
        };
    };

    const handleSelect = (option: string) => {
        if (selectedAnswer !== null) return;
        haptic.medium();
        onSelect(option);
    };

    const progressPercent = ((questionNumber - 1) / totalQuestions) * 100;

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-[#F4F7FD] px-3 py-1.5 text-[11px] font-semibold text-[#60728F]">
                    Question {questionNumber} of {totalQuestions}
                </span>
                {selectedAnswer && (
                    <span className="rounded-full bg-[#EEF3FF] px-3 py-1.5 text-[11px] font-bold text-[#2D5BFF]">
                        Answer saved
                    </span>
                )}
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[rgba(31,53,91,0.08)]">
                <div
                    className="h-full rounded-full bg-[#18253D] transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="app-sheet overflow-hidden p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {question.question_type && (
                            <p className="app-section-label">
                                {formatQuestionType(question.question_type)}
                            </p>
                        )}
                        {question.difficulty && (
                            <span className="rounded-full bg-[#FFF6DF] px-3 py-1.5 text-[11px] font-semibold capitalize text-[#B27614]">
                                {question.difficulty}
                            </span>
                        )}
                    </div>
                    {question.hint && (
                        <button
                            type="button"
                            onClick={() => {
                                haptic.light();
                                setShowHint((current) => !current);
                            }}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                                showHint
                                    ? "bg-[#18253D] text-white"
                                    : "bg-[#EEF3FF] text-[#2D5BFF]"
                            }`}
                        >
                            {showHint ? "Hide hint" : "Show hint"}
                        </button>
                    )}
                </div>
                <p className="text-[1.02rem] font-semibold leading-relaxed text-[#1A1A1A]">
                    {question.text}
                </p>
                {question.hint && showHint && (
                    <div className="mt-4 rounded-[20px] border border-[rgba(31,53,91,0.06)] bg-[rgba(244,247,252,0.92)] px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7F8CA5]">Hint</p>
                        <p className="mt-2 text-sm leading-relaxed text-[#53627D]">{question.hint}</p>
                    </div>
                )}
            </div>

            {isTextQuestion ? (
                <div className="app-sheet p-5">
                    {question.question_type === "matching" && optionKeys.length > 0 && (
                        <div className="mb-4 space-y-2">
                            {optionKeys.map((option) => (
                                <div key={option} className="rounded-[18px] bg-[rgba(233,239,247,0.88)] px-4 py-3 text-sm text-[#53627D]">
                                    {getOptionText(option)}
                                </div>
                            ))}
                        </div>
                    )}
                    <textarea
                        value={draftAnswer}
                        onChange={(event) => setDraftAnswer(event.target.value)}
                        disabled={selectedAnswer !== null}
                        rows={question.question_type === "essay" ? 6 : 4}
                        placeholder={
                            question.question_type === "matching"
                                ? "Type your matching answer"
                                : "Type your answer"
                        }
                        className="app-input min-h-[120px] resize-none"
                    />
                    {!selectedAnswer && (
                        <button
                            onClick={() => {
                                const nextAnswer = draftAnswer.trim();
                                if (!nextAnswer) return;
                                haptic.medium();
                                onSelect(nextAnswer);
                            }}
                            className="mt-4 inline-flex min-h-11 items-center rounded-[18px] bg-[#18253D] px-5 py-3 text-sm font-semibold text-white"
                        >
                            Save answer and continue
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {optionKeys.map((option) => {
                        const style = getOptionStyle(option);
                        const isAnswered = selectedAnswer !== null;

                        return (
                            <button
                                key={option}
                                onClick={() => handleSelect(option)}
                                disabled={isAnswered}
                                className="flex items-center gap-3 rounded-[22px] p-4
                         text-left transition-all duration-200
                         active:scale-[0.98] disabled:cursor-default"
                                style={{
                                    border: `1px solid ${style.border}`,
                                    backgroundColor: style.bg,
                                }}
                            >
                                <span
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
                           text-xs font-bold transition-colors duration-200"
                                    style={{
                                        backgroundColor: style.labelBg,
                                        color: isAnswered && option === selectedAnswer ? "#FFFFFF" : "#53627D",
                                    }}
                                >
                                    {OPTION_LABELS[option]}
                                </span>

                                <span
                                    className="flex-1 text-sm font-medium leading-relaxed"
                                    style={{ color: style.text }}
                                >
                                    {getOptionText(option)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function getOptionValue(question: Question, key: string): string | undefined {
    const map: Record<string, string | undefined> = {
        a: question.option_a,
        b: question.option_b,
        c: question.option_c,
        d: question.option_d,
        e: question.option_e,
    };

    return map[key];
}

function getOptionKeys(question: Question): string[] {
    const keys = ["a", "b", "c", "d", "e"];
    if (question.question_type === "true_false") {
        return keys.filter((key) => ["a", "b"].includes(key) && Boolean(getOptionValue(question, key)));
    }
    return keys.filter((key) => Boolean(getOptionValue(question, key)));
}

function isFreeTextQuestion(questionType?: string) {
    return questionType === "fill_blank" || questionType === "matching" || questionType === "essay";
}

function formatQuestionType(questionType: string) {
    const labels: Record<string, string> = {
        mcq: "Multiple choice",
        true_false: "True or false",
        fill_blank: "Fill in the blank",
        matching: "Matching",
        essay: "Essay",
    };

    return labels[questionType] ?? questionType;
}
