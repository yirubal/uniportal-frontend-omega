import { useEffect, useState } from "react";
import type { Question } from "../store/quizStore";
import { useTelegram } from "../hooks/useTelegram";
import { getQuestionOptions, getResolvedQuestionType, splitMatchingPair } from "../utils/questions";

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    selectedAnswer: string | null;
    onSelect: (answer: string) => void;
    simulationMode?: boolean;
    showQuestionType?: boolean;
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
    showQuestionType = true,
}: QuestionCardProps) {
    const { haptic } = useTelegram();
    const [draftAnswer, setDraftAnswer] = useState(selectedAnswer ?? "");
    const [showHint, setShowHint] = useState(false);
    const optionEntries = getQuestionOptions(question);
    const questionType = getResolvedQuestionType(question);
    const hasSavedAnswer = hasMeaningfulAnswer(questionType, selectedAnswer);
    const progressPercent = ((questionNumber - 1) / totalQuestions) * 100;

    useEffect(() => {
        setDraftAnswer(selectedAnswer ?? "");
        setShowHint(false);
    }, [question.id]);

    const handleSaveTextAnswer = () => {
        const nextAnswer = draftAnswer.trim();
        if (!nextAnswer) return;

        haptic.medium();
        onSelect(nextAnswer);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-[#F4F8F5] px-3 py-1.5 text-[11px] font-semibold text-[#60728F]">
                    Question {questionNumber} of {totalQuestions}
                </span>
                {hasSavedAnswer && (
                    <span className="rounded-full bg-[#EAF4F1] px-3 py-1.5 text-[11px] font-bold text-[#3F6F6A]">
                        {questionType === "matching" ? "Ready to continue" : "Answer saved"}
                    </span>
                )}
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[rgba(23,43,47,0.08)]">
                <div
                    className="h-full rounded-full bg-[#172B2F] transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="app-sheet overflow-hidden p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {showQuestionType && questionType && (
                            <p className="app-section-label">
                                {formatQuestionType(questionType)}
                            </p>
                        )}
                        {question.difficulty && (
                            <span className="rounded-full bg-[#FFF6DF] px-3 py-1.5 text-[11px] font-semibold capitalize text-[#B27614]">
                                {question.difficulty}
                            </span>
                        )}
                        {question.year_source && (
                            <span className="rounded-full bg-[#F4F8F5] px-3 py-1.5 text-[11px] font-semibold text-[#60728F]">
                                {question.year_source}
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
                                    ? "bg-[#172B2F] text-white"
                                    : "bg-[#EAF4F1] text-[#3F6F6A]"
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
                    <div className="mt-4 rounded-[20px] border border-[rgba(23,43,47,0.06)] bg-[rgba(244,247,252,0.92)] px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#70868B]">Hint</p>
                        <p className="mt-2 text-sm leading-relaxed text-[#526B70]">{question.hint}</p>
                    </div>
                )}
            </div>

            {(questionType === "mcq" || questionType === "true_false") && (
                <div className="flex flex-col gap-3.5">
                    {optionEntries.map(([option, label]) => {
                        const style = getOptionStyle(option, selectedAnswer, simulationMode);
                        const isSelected = option === selectedAnswer;

                        return (
                            <button
                                type="button"
                                key={option}
                                onClick={() => {
                                    haptic.medium();
                                    onSelect(option);
                                }}
                                className="flex min-h-16 min-w-0 items-start gap-3.5 rounded-[22px] px-5 py-4 text-left transition-all duration-200 active:scale-[0.98]"
                                style={{
                                    border: `1px solid ${style.border}`,
                                    backgroundColor: style.bg,
                                }}
                            >
                                <span
                                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200"
                                    style={{
                                        backgroundColor: style.labelBg,
                                        color: isSelected ? "#FFFFFF" : "#526B70",
                                    }}
                                >
                                    {OPTION_LABELS[option] ?? option.toUpperCase()}
                                </span>

                                <span
                                    className="min-w-0 flex-1 text-sm font-medium leading-relaxed [overflow-wrap:anywhere]"
                                    style={{ color: style.text }}
                                >
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {questionType === "fill_blank" && (
                <div className="app-sheet p-5">
                    <input
                        type="text"
                        value={draftAnswer}
                        onChange={(event) => {
                            const nextValue = event.target.value;
                            setDraftAnswer(nextValue);
                            onSelect(nextValue);
                        }}
                        placeholder="Type your answer"
                        className="app-input min-h-12"
                    />
                    <button
                        type="button"
                        onClick={handleSaveTextAnswer}
                        className="mt-4 inline-flex min-h-11 items-center rounded-[18px] bg-[#172B2F] px-5 py-3 text-sm font-semibold text-white"
                    >
                        {hasSavedAnswer ? "Update answer" : "Save answer"}
                    </button>
                </div>
            )}

            {questionType === "matching" && (
                <div className="app-sheet p-5">
                    <div className="space-y-3">
                        {optionEntries.map(([option, label]) => {
                            const pair = splitMatchingPair(label);

                            return (
                                <div
                                    key={option}
                                    className="rounded-[22px] border border-[rgba(23,43,47,0.08)] bg-[rgba(239,244,249,0.84)] px-4 py-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#70868B]">
                                                Term
                                            </p>
                                            <p className="mt-2 text-sm font-semibold text-[#172B2F]">
                                                {pair.left}
                                            </p>
                                        </div>
                                        <div className="min-w-0 text-right">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#70868B]">
                                                Match
                                            </p>
                                            <p className="mt-2 text-sm text-[#526B70]">
                                                {pair.right || label}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 rounded-[18px] bg-[#F4F8F5] px-4 py-3 text-sm text-[#526B70]">
                        This matching item is read-only. No answer is required before continuing.
                    </div>
                </div>
            )}

            {questionType === "essay" && (
                <div className="app-sheet p-5">
                    <textarea
                        value={draftAnswer}
                        onChange={(event) => {
                            const nextValue = event.target.value;
                            setDraftAnswer(nextValue);
                            onSelect(nextValue);
                        }}
                        rows={6}
                        placeholder="Write your answer"
                        className="app-input min-h-[140px] resize-none"
                    />
                    <button
                        type="button"
                        onClick={handleSaveTextAnswer}
                        className="mt-4 inline-flex min-h-11 items-center rounded-[18px] bg-[#172B2F] px-5 py-3 text-sm font-semibold text-white"
                    >
                        {hasSavedAnswer ? "Update answer" : "Save answer"}
                    </button>
                </div>
            )}
        </div>
    );
}

function getOptionStyle(option: string, selectedAnswer: string | null, simulationMode: boolean) {
    if (selectedAnswer === null) {
        return {
            border: "rgba(23, 43, 47, 0.08)",
            bg: "rgba(239, 244, 249, 0.9)",
            text: "#172B2F",
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
        border: "rgba(23, 43, 47, 0.08)",
        bg: "rgba(239, 244, 249, 0.72)",
        text: "#4D607F",
        labelBg: "rgba(224, 232, 241, 0.95)",
    };
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

function hasMeaningfulAnswer(questionType: string | undefined, selectedAnswer: string | null) {
    if (questionType === "matching") {
        return true;
    }

    if (questionType === "fill_blank" || questionType === "essay") {
        return (selectedAnswer ?? "").trim().length > 0;
    }

    return selectedAnswer !== null;
}
