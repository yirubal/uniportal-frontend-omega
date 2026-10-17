import { memo, useEffect, useRef, useState } from "react";
import type { Question } from "../store/quizStore";
import { getQuestionOptions, getResolvedQuestionType, splitMatchingPair } from "../utils/questions";

interface QuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    selectedAnswer: string | null;
    /** Receives the question id too, so a debounced text answer is saved to the right question. */
    onSelect: (answer: string, questionId: number) => void;
    showQuestionType?: boolean;
    /** Which way the attempt last moved: the card slides in from that side. */
    enterDirection?: 1 | -1;
}

const OPTION_LABELS: Record<string, string> = {
    a: "A",
    b: "B",
    c: "C",
    d: "D",
    e: "E",
};

/** Typed answers are saved after a short pause instead of on every keystroke (each save persists the attempt). */
const TEXT_SAVE_DELAY_MS = 300;

function QuestionCard({
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onSelect,
    showQuestionType = true,
    enterDirection = 1,
}: QuestionCardProps) {
    const [draftAnswer, setDraftAnswer] = useState(selectedAnswer ?? "");
    const [showHint, setShowHint] = useState(false);
    const optionEntries = getQuestionOptions(question);
    const questionType = getResolvedQuestionType(question);
    const hasSavedAnswer = hasMeaningfulAnswer(questionType, selectedAnswer);
    const progressPercent = ((questionNumber - 1) / totalQuestions) * 100;
    // The card remounts per question, so the bar animates from where the previous question left it.
    const progressFrom = Math.min(100, Math.max(0, ((questionNumber - 1 - enterDirection) / totalQuestions) * 100));

    // Draft and hint state reset per question because parents render this card with key={question.id}.
    const pendingTextRef = useRef<string | null>(null);
    const saveTimerRef = useRef<number | undefined>(undefined);
    const onSelectRef = useRef(onSelect);
    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    const flushTextAnswer = () => {
        window.clearTimeout(saveTimerRef.current);
        if (pendingTextRef.current === null) return;
        onSelectRef.current(pendingTextRef.current, question.id);
        pendingTextRef.current = null;
    };
    const flushTextAnswerRef = useRef(flushTextAnswer);
    useEffect(() => {
        flushTextAnswerRef.current = flushTextAnswer;
    });

    // Save a pending answer when the card goes away (moving to another question or submitting).
    useEffect(() => () => flushTextAnswerRef.current(), []);

    const handleTextChange = (value: string) => {
        setDraftAnswer(value);
        pendingTextRef.current = value;
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(flushTextAnswer, TEXT_SAVE_DELAY_MS);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-mist px-3 py-1.5 text-[11px] font-semibold text-steel">
                    Question {questionNumber} of {totalQuestions}
                </span>
                {hasSavedAnswer && (
                    <span className="rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-bold text-accent">
                        {questionType === "matching" ? "Ready to continue" : "Answer saved"}
                    </span>
                )}
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                    className="progress-fill h-full rounded-full bg-fill"
                    style={{ width: `${progressPercent}%`, "--progress-from": `${progressFrom}%` } as React.CSSProperties}
                />
            </div>

            <div
                className="question-enter flex flex-col gap-4"
                style={{ "--question-from": enterDirection > 0 ? "28px" : "-28px" } as React.CSSProperties}
            >

            <div className="app-sheet overflow-hidden p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {showQuestionType && questionType && (
                            <p className="app-section-label">
                                {formatQuestionType(questionType)}
                            </p>
                        )}
                        {question.difficulty && (
                            <span className="rounded-full bg-gold-tint px-3 py-1.5 text-[11px] font-semibold capitalize text-gold-ink">
                                {question.difficulty}
                            </span>
                        )}
                        {question.year_source && (
                            <span className="rounded-full bg-mist px-3 py-1.5 text-[11px] font-semibold text-steel">
                                {question.year_source}
                            </span>
                        )}
                    </div>
                    {question.hint && (
                        <button
                            type="button"
                            aria-pressed={showHint}
                            onClick={() => setShowHint((current) => !current)}
                            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${showHint
                                ? "bg-fill text-white"
                                : "bg-accent-soft text-accent"
                                }`}
                        >
                            {showHint ? "Hide hint" : "Show hint"}
                        </button>
                    )}
                </div>

                <p className="text-[1.02rem] font-semibold leading-relaxed text-ink">
                    {question.text}
                </p>

                {question.hint && showHint && (
                    <div className="mt-4 rounded-[20px] border border-line bg-mist px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Hint</p>
                        <p className="mt-2 text-sm leading-relaxed text-subtle">{question.hint}</p>
                    </div>
                )}
            </div>

            {(questionType === "mcq" || questionType === "true_false") && (
                <div className="flex flex-col gap-3.5" role="radiogroup" aria-label="Answer options">
                    {optionEntries.map(([option, label]) => {
                        const style = getOptionStyle(option, selectedAnswer);

                        return (
                            <button
                                type="button"
                                role="radio"
                                aria-checked={option === selectedAnswer}
                                key={option}
                                data-haptic="medium"
                                onClick={() => onSelect(option, question.id)}
                                className="flex min-h-16 min-w-0 items-center gap-3 rounded-[16px] px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.98] !px-1"
                                style={{
                                    border: `2px solid ${style.border}`,
                                    backgroundColor: style.bg,
                                }}
                            >
                                <span
                                    // Keyed on the selected state so the letter pops each time it is chosen.
                                    key={option === selectedAnswer ? "selected" : "idle"}
                                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center self-center rounded-full px-1 py-1 text-xs font-bold transition-colors duration-200 ${option === selectedAnswer ? "option-pop" : ""}`}
                                    style={{
                                        backgroundColor: style.labelBg,
                                        color: style.labelText,
                                    }}
                                >
                                    {OPTION_LABELS[option] ?? option.toUpperCase()}
                                </span>

                                <span
                                    className="min-w-0 flex-1 self-center text-sm font-medium leading-relaxed [overflow-wrap:anywhere]"
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
                        aria-label="Your answer"
                        value={draftAnswer}
                        onChange={(event) => handleTextChange(event.target.value)}
                        // Tapping Next/Submit blurs the field first, so the answer is saved before they run.
                        onBlur={flushTextAnswer}
                        placeholder="Type your answer"
                        className="app-input min-h-12"
                    />
                    <p className="mt-3 text-xs text-subtle">Your answer is saved as you type.</p>
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
                                    className="rounded-[22px] border border-line bg-wash px-4 py-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                                                Term
                                            </p>
                                            <p className="mt-2 text-sm font-semibold text-ink">
                                                {pair.left}
                                            </p>
                                        </div>
                                        <div className="min-w-0 text-right">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                                                Match
                                            </p>
                                            <p className="mt-2 text-sm text-subtle">
                                                {pair.right || label}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 rounded-[18px] bg-mist px-4 py-3 text-sm text-subtle">
                        This matching item is read-only. No answer is required before continuing.
                    </div>
                </div>
            )}

            {questionType === "essay" && (
                <div className="app-sheet p-5">
                    <textarea
                        aria-label="Your answer"
                        value={draftAnswer}
                        onChange={(event) => handleTextChange(event.target.value)}
                        // Tapping Next/Submit blurs the field first, so the answer is saved before they run.
                        onBlur={flushTextAnswer}
                        rows={6}
                        placeholder="Write your answer"
                        className="app-input min-h-[140px] resize-none"
                    />
                    <p className="mt-3 text-xs text-subtle">Your answer is saved as you type.</p>
                </div>
            )}
            </div>
        </div>
    );
}

// Answer options: card surface with dark text; the selected option takes the strong fill. Theme variables, so
// both light and dark mode work.
const OPTION_STYLE = {
    border: "var(--color-edge)",
    bg: "var(--color-card)",
    text: "var(--color-ink)",
    labelBg: "var(--color-mist)",
    labelText: "var(--color-ink-soft)",
};
const SELECTED_OPTION_STYLE = {
    border: "var(--color-fill)",
    bg: "color-mix(in srgb, var(--color-fill) 8%, var(--color-card))",
    text: "var(--color-ink)",
    labelBg: "var(--color-fill)",
    labelText: "#FFFFFF",
};

function getOptionStyle(option: string, selectedAnswer: string | null) {
    return option === selectedAnswer ? SELECTED_OPTION_STYLE : OPTION_STYLE;
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

export default memo(QuestionCard);
