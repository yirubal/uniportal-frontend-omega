import { AlertTriangle, Check, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { normalizeAnswer, type ReviewQuestion, type ReviewStatus } from "../../utils/answerReview";
import { STATUS_META } from "./reviewStatus";

export function ReviewShell({
    children,
    onClose,
    progressLabel,
}: {
    children: React.ReactNode;
    onClose: () => void;
    progressLabel: string;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    useDialogFocus(panelRef, { onClose });

    return (
        <div
            className="fixed inset-0 z-[90] flex items-start justify-center bg-[rgba(8,18,34,0.52)] px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm sm:px-5 sm:pt-5"
            onClick={onClose}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="answer-review-title"
                className="flex h-[92dvh] max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-line bg-card shadow-[0_24px_70px_rgba(10,22,40,0.26)] sm:h-[86dvh] sm:max-h-[86dvh]"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                        <p className="app-section-label">Question feedback</p>
                        <h2 id="answer-review-title" className="mt-1 text-xl font-black leading-tight text-ink">
                            Answer Review
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-subtle">{progressLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close answer review"
                        className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink transition-colors hover:bg-accent-wash focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    >
                        <X size={19} />
                    </button>
                </header>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function QuestionListPanel({
    questions,
    selectedIndex,
    onSelectQuestion,
}: {
    questions: ReviewQuestion[];
    selectedIndex: number;
    onSelectQuestion: (index: number) => void;
}) {
    const selectedItemRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [selectedIndex]);

    return (
        <section
            aria-label="Question list"
            className="hidden min-h-0 rounded-[18px] border border-line bg-accent-soft p-2 md:block"
        >
            <div className="flex max-h-full flex-col gap-2 overflow-y-auto pr-1">
                {questions.map((question, index) => (
                    <QuestionListItem
                        key={question.questionId}
                        ref={index === selectedIndex ? selectedItemRef : null}
                        number={index + 1}
                        status={question.status}
                        isSelected={index === selectedIndex}
                        onClick={() => onSelectQuestion(index)}
                    />
                ))}
            </div>
        </section>
    );
}

const QuestionListItem = function QuestionListItem({
    number,
    status,
    isSelected,
    onClick,
    ref,
}: {
    number: number;
    status: ReviewStatus;
    isSelected: boolean;
    onClick: () => void;
    ref?: React.Ref<HTMLButtonElement>;
}) {
    const meta = STATUS_META[status];
    const Icon = meta.Icon;

    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            aria-pressed={isSelected}
            aria-label={`Question ${number}: ${meta.label}`}
            className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                isSelected
                    ? "border-fill bg-card text-ink shadow-[0_10px_24px_rgba(23,43,47,0.08)]"
                    : meta.listClass
            }`}
        >
            <span className="text-sm font-black leading-none">Q{number}</span>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isSelected ? meta.badgeClass : "bg-card/78"}`}>
                <Icon size={15} strokeWidth={3} aria-hidden="true" />
            </span>
        </button>
    );
};

export function QuestionDetailPanel({
    question,
    questionNumber,
    totalQuestions,
    onPrevious,
    onNext,
}: {
    question: ReviewQuestion;
    questionNumber: number;
    totalQuestions: number;
    onPrevious: () => void;
    onNext: () => void;
}) {
    const meta = STATUS_META[question.status];
    const Icon = meta.Icon;
    const optionEntries = Object.entries(question.options).filter(([, text]) => text?.trim());

    return (
        <article className="min-w-0 max-w-full space-y-4 overflow-hidden pb-1">
            <section className={`flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-[16px] border-l-4 px-4 py-4 ${meta.bannerClass}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.badgeClass}`}>
                    <Icon size={18} strokeWidth={3} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-black leading-tight [overflow-wrap:anywhere]">{meta.detailLabel}</p>
                    <p className="mt-1 text-xs font-semibold opacity-80">
                        Question {questionNumber} of {totalQuestions}
                    </p>
                </div>
            </section>

            <section className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-line bg-card px-4 py-4 shadow-[0_8px_18px_rgba(23,43,47,0.04)]">
                <p className="app-section-label">Question</p>
                <h3 className="mt-3 text-base font-bold leading-relaxed text-ink [overflow-wrap:anywhere]">
                    {question.questionText}
                </h3>
            </section>

            {optionEntries.length > 0 ? (
                <section className="min-w-0 max-w-full overflow-hidden" aria-label="Answer options">
                    <p className="app-section-label mb-3">Your answer and correct answer</p>
                    <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 lg:grid-cols-2">
                        {optionEntries.map(([letter, text]) => (
                            <OptionReviewItem
                                key={letter}
                                letter={letter}
                                text={text}
                                isSelected={normalizeAnswer(question.selectedOption) === normalizeAnswer(letter)}
                                isCorrect={normalizeAnswer(question.correctOption) === normalizeAnswer(letter)}
                                status={question.status}
                            />
                        ))}
                    </div>
                </section>
            ) : (
                <FreeTextAnswer question={question} />
            )}

            {question.explanation && <ExplanationBox explanation={question.explanation} />}

            {question.topicTags.length > 0 && <TopicTags tags={question.topicTags} />}

            <NavigationButtons
                onPrevious={onPrevious}
                onNext={onNext}
                isFirstQuestion={questionNumber === 1}
                isLastQuestion={questionNumber === totalQuestions}
            />
        </article>
    );
}

function OptionReviewItem({
    letter,
    text,
    isSelected,
    isCorrect,
    status,
}: {
    letter: string;
    text: string;
    isSelected: boolean;
    isCorrect: boolean;
    status: ReviewStatus;
}) {
    const isWrongSelection = isSelected && status === "incorrect" && !isCorrect;
    const stateClass = isCorrect
        ? "border-ok bg-success-tint"
        : isWrongSelection
            ? "border-bad bg-bad-tint"
            : isSelected
                ? "border-warn bg-warn-tint"
                : "border-line bg-card";
    const markerClass = isCorrect
        ? "bg-ok text-white"
        : isWrongSelection
            ? "bg-bad text-white"
            : isSelected
                ? "bg-warn text-white"
                : "bg-accent-soft text-subtle";

    return (
        <div
            role="group"
            aria-label={`Option ${letter.toUpperCase()}: ${text}${isCorrect ? ". Correct answer" : ""}${isWrongSelection ? ". Your incorrect answer" : ""}`}
            className={`relative flex min-h-14 min-w-0 max-w-full items-start gap-3 overflow-hidden rounded-[14px] border px-4 py-3 ${stateClass} ${isCorrect ? "review-correct" : isWrongSelection ? "review-wrong" : ""}`}
        >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-black ${markerClass}`}>
                {letter.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-relaxed text-ink [overflow-wrap:anywhere]">{text}</p>
                <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                    {isCorrect && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-ok-tint px-2.5 py-1 text-[11px] font-bold text-ok-ink [overflow-wrap:anywhere]">
                            <Check size={12} strokeWidth={3} aria-hidden="true" />
                            Correct answer
                        </span>
                    )}
                    {isWrongSelection && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-bad-tint px-2.5 py-1 text-[11px] font-bold text-bad-ink [overflow-wrap:anywhere]">
                            <X size={12} strokeWidth={3} aria-hidden="true" />
                            Your answer
                        </span>
                    )}
                    {isSelected && !isWrongSelection && !isCorrect && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-warn-tint px-2.5 py-1 text-[11px] font-bold text-warn-ink [overflow-wrap:anywhere]">
                            <AlertTriangle size={12} strokeWidth={3} aria-hidden="true" />
                            Your answer
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function FreeTextAnswer({ question }: { question: ReviewQuestion }) {
    return (
        <section className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-line bg-card px-4 py-4">
            <p className="app-section-label">Student answer</p>
            <p className="mt-3 text-[15px] font-semibold leading-relaxed text-ink [overflow-wrap:anywhere]">
                {question.selectedOption?.trim() || "No answer submitted"}
            </p>
            {question.correctOption && (
                <>
                    <p className="app-section-label mt-5">Expected answer</p>
                    <p className="mt-3 text-[15px] font-semibold leading-relaxed text-ink [overflow-wrap:anywhere]">
                        {question.correctOption}
                    </p>
                </>
            )}
        </section>
    );
}

function ExplanationBox({ explanation }: { explanation: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLong = explanation.length > 500;
    const displayText = isLong && !isExpanded ? `${explanation.slice(0, 500).trim()}...` : explanation;

    return (
        <section
            aria-label="Explanation"
            className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-warn-line border-l-4 border-l-warn bg-warn-tint px-4 py-4"
        >
            <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn-tint text-warn-ink">
                    <Lightbulb size={17} aria-hidden="true" />
                </span>
                <h4 className="min-w-0 text-sm font-black uppercase tracking-[0.12em] text-warn-ink [overflow-wrap:anywhere]">Explanation</h4>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-warn-ink [overflow-wrap:anywhere]">{displayText}</p>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setIsExpanded((current) => !current)}
                    aria-expanded={isExpanded}
                    className="mt-3 min-h-12 rounded-[12px] px-1 text-sm font-black text-warn-ink underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-warn focus:ring-offset-2"
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            )}
        </section>
    );
}

function TopicTags({ tags }: { tags: string[] }) {
    return (
        <section aria-label="Topics covered" className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-line bg-accent-soft px-4 py-4">
            <p className="app-section-label">Topics covered</p>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="max-w-full rounded-[10px] border border-accent-line bg-card px-3 py-2 text-xs font-bold text-accent-deep [overflow-wrap:anywhere]"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </section>
    );
}

function NavigationButtons({
    onPrevious,
    onNext,
    isFirstQuestion,
    isLastQuestion,
}: {
    onPrevious: () => void;
    onNext: () => void;
    isFirstQuestion: boolean;
    isLastQuestion: boolean;
}) {
    return (
        <div className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 overflow-hidden border-t border-line pt-4 sm:gap-3">
            <button
                type="button"
                onClick={onPrevious}
                disabled={isFirstQuestion}
                aria-label="Previous question"
                className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border border-line bg-mist px-2.5 py-3 text-sm font-black text-ink transition-colors hover:bg-background disabled:cursor-not-allowed disabled:bg-background disabled:text-faint focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent focus:ring-offset-0 sm:gap-2 sm:px-3"
            >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
            </button>
            <button
                type="button"
                onClick={onNext}
                disabled={isLastQuestion}
                aria-label="Next question"
                className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border border-accent-line bg-accent-soft px-2.5 py-3 text-sm font-black text-accent-deep transition-colors hover:bg-accent-wash disabled:cursor-not-allowed disabled:border-edge disabled:bg-background disabled:text-faint focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent focus:ring-offset-0 sm:gap-2 sm:px-3"
            >
                Next
                <ChevronRight size={16} aria-hidden="true" />
            </button>
        </div>
    );
}
