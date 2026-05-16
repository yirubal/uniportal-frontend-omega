import {
    AlertTriangle,
    Check,
    ChevronLeft,
    ChevronRight,
    Lightbulb,
    Minus,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AttemptAnswerDetail, AttemptSummary, Question } from "../store/quizStore";
import { getQuestionOptions, getResolvedQuestionType } from "../utils/questions";

type ReviewStatus = "correct" | "incorrect" | "unanswered" | "not_graded";

interface ReviewQuestion {
    questionId: string;
    questionText: string;
    options: Record<string, string>;
    selectedOption: string | null;
    correctOption: string | null;
    status: ReviewStatus;
    explanation: string | null;
    topicTags: string[];
}

interface AnswerReviewModalProps {
    attempt: AttemptSummary;
    questions: Question[];
    answers: Record<number, string>;
    onClose: () => void;
}

const STATUS_META: Record<ReviewStatus, {
    label: string;
    detailLabel: string;
    listClass: string;
    bannerClass: string;
    badgeClass: string;
    Icon: typeof Check;
}> = {
    correct: {
        label: "Correct",
        detailLabel: "Correct answer",
        listClass: "border-[#10B981]/40 bg-[#ECFDF5] text-[#065F46]",
        bannerClass: "border-[#10B981] bg-[#ECFDF5] text-[#065F46]",
        badgeClass: "bg-[#10B981] text-white",
        Icon: Check,
    },
    incorrect: {
        label: "Incorrect",
        detailLabel: "Incorrect answer",
        listClass: "border-[#EF4444]/35 bg-[#FEF2F2] text-[#991B1B]",
        bannerClass: "border-[#EF4444] bg-[#FEF2F2] text-[#991B1B]",
        badgeClass: "bg-[#EF4444] text-white",
        Icon: X,
    },
    unanswered: {
        label: "Unanswered",
        detailLabel: "No answer submitted",
        listClass: "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#92400E]",
        bannerClass: "border-[#F59E0B] bg-[#FFFBEB] text-[#92400E]",
        badgeClass: "bg-[#F59E0B] text-white",
        Icon: AlertTriangle,
    },
    not_graded: {
        label: "Not graded",
        detailLabel: "Needs manual review",
        listClass: "border-[#F59E0B]/40 bg-[#FFFBEB] text-[#92400E]",
        bannerClass: "border-[#F59E0B] bg-[#FFFBEB] text-[#92400E]",
        badgeClass: "bg-[#F59E0B] text-white",
        Icon: Minus,
    },
};

export default function AnswerReviewModal({
    attempt,
    questions,
    answers,
    onClose,
}: AnswerReviewModalProps) {
    const reviewQuestions = useMemo(
        () => buildReviewQuestions(attempt, questions, answers),
        [answers, attempt, questions]
    );
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedQuestion = reviewQuestions[selectedIndex] ?? null;
    const totalQuestions = reviewQuestions.length;

    useEffect(() => {
        if (selectedIndex >= totalQuestions) {
            setSelectedIndex(0);
        }
    }, [selectedIndex, totalQuestions]);

    const goToPrevious = useCallback(() => {
        setSelectedIndex((current) => Math.max(current - 1, 0));
    }, []);

    const goToNext = useCallback(() => {
        setSelectedIndex((current) => Math.min(current + 1, totalQuestions - 1));
    }, [totalQuestions]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                goToNext();
            }

            if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                goToPrevious();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrevious, onClose]);

    if (!totalQuestions) {
        return (
            <ReviewShell
                onClose={onClose}
                progressLabel="No questions available"
            >
                <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[22px] bg-white px-5 text-center">
                    <p className="text-base font-bold text-[#172B2F]">No answer details available</p>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#526B70]">
                        This attempt did not keep question-level review data.
                    </p>
                </div>
            </ReviewShell>
        );
    }

    return (
        <ReviewShell
            onClose={onClose}
            progressLabel={`Question ${selectedIndex + 1} of ${totalQuestions}`}
        >
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[9.75rem_minmax(0,1fr)] md:gap-5">
                <QuestionListPanel
                    questions={reviewQuestions}
                    selectedIndex={selectedIndex}
                    onSelectQuestion={setSelectedIndex}
                />

                <div className="min-h-0 overflow-y-auto overscroll-contain pr-0.5 md:pr-2" aria-live="polite">
                    {selectedQuestion && (
                        <QuestionDetailPanel
                            question={selectedQuestion}
                            questionNumber={selectedIndex + 1}
                            totalQuestions={totalQuestions}
                            onPrevious={goToPrevious}
                            onNext={goToNext}
                        />
                    )}
                </div>
            </div>
        </ReviewShell>
    );
}

function ReviewShell({
    children,
    onClose,
    progressLabel,
}: {
    children: React.ReactNode;
    onClose: () => void;
    progressLabel: string;
}) {
    return (
        <div
            className="fixed inset-0 z-[90] flex items-end bg-[rgba(8,18,34,0.52)] px-3 py-3 backdrop-blur-sm sm:items-center sm:justify-center sm:px-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="answer-review-title"
            onClick={onClose}
        >
            <div
                className="flex h-[92dvh] max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[24px] border border-[rgba(23,43,47,0.08)] bg-[#F8FBF9] shadow-[0_24px_70px_rgba(10,22,40,0.26)] sm:h-[86dvh] sm:max-h-[86dvh] sm:rounded-[24px]"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[rgba(23,43,47,0.08)] px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                        <p className="app-section-label">Question feedback</p>
                        <h2 id="answer-review-title" className="mt-1 text-xl font-black leading-tight text-[#172B2F]">
                            Answer Review
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-[#526B70]">{progressLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close answer review"
                        className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF4F1] text-[#172B2F] transition-colors hover:bg-[#DDECE8] focus:outline-none focus:ring-2 focus:ring-[#3F6F6A] focus:ring-offset-2"
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

function QuestionListPanel({
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
            className="hidden min-h-0 rounded-[18px] border border-[rgba(23,43,47,0.08)] bg-[rgba(234,244,241,0.72)] p-2 md:block"
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
            className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[14px] border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#3F6F6A] focus:ring-offset-2 ${
                isSelected
                    ? "border-[#172B2F] bg-white text-[#172B2F] shadow-[0_10px_24px_rgba(23,43,47,0.08)]"
                    : meta.listClass
            }`}
        >
            <span className="text-sm font-black leading-none">Q{number}</span>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isSelected ? meta.badgeClass : "bg-white/78"}`}>
                <Icon size={15} strokeWidth={3} aria-hidden="true" />
            </span>
        </button>
    );
};

function QuestionDetailPanel({
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

            <section className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-[rgba(23,43,47,0.08)] bg-white px-4 py-4 shadow-[0_8px_18px_rgba(23,43,47,0.04)]">
                <p className="app-section-label">Question</p>
                <h3 className="mt-3 text-base font-bold leading-relaxed text-[#172B2F] [overflow-wrap:anywhere]">
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
        ? "border-[#10B981] bg-[#ECFDF5]"
        : isWrongSelection
            ? "border-[#EF4444] bg-[#FEF2F2]"
            : isSelected
                ? "border-[#F59E0B] bg-[#FFFBEB]"
                : "border-[rgba(23,43,47,0.08)] bg-white";
    const markerClass = isCorrect
        ? "bg-[#10B981] text-white"
        : isWrongSelection
            ? "bg-[#EF4444] text-white"
            : isSelected
                ? "bg-[#F59E0B] text-white"
                : "bg-[#EAF4F1] text-[#526B70]";

    return (
        <div
            role="group"
            aria-label={`Option ${letter.toUpperCase()}: ${text}${isCorrect ? ". Correct answer" : ""}${isWrongSelection ? ". Your incorrect answer" : ""}`}
            className={`relative flex min-h-14 min-w-0 max-w-full items-start gap-3 overflow-hidden rounded-[14px] border px-4 py-3 ${stateClass}`}
        >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-sm font-black ${markerClass}`}>
                {letter.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-relaxed text-[#172B2F] [overflow-wrap:anywhere]">{text}</p>
                <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                    {isCorrect && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[11px] font-bold text-[#065F46] [overflow-wrap:anywhere]">
                            <Check size={12} strokeWidth={3} aria-hidden="true" />
                            Correct answer
                        </span>
                    )}
                    {isWrongSelection && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#FEE2E2] px-2.5 py-1 text-[11px] font-bold text-[#991B1B] [overflow-wrap:anywhere]">
                            <X size={12} strokeWidth={3} aria-hidden="true" />
                            Your answer
                        </span>
                    )}
                    {isSelected && !isWrongSelection && !isCorrect && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-bold text-[#92400E] [overflow-wrap:anywhere]">
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
        <section className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-[rgba(23,43,47,0.08)] bg-white px-4 py-4">
            <p className="app-section-label">Student answer</p>
            <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[#172B2F] [overflow-wrap:anywhere]">
                {question.selectedOption?.trim() || "No answer submitted"}
            </p>
            {question.correctOption && (
                <>
                    <p className="app-section-label mt-5">Expected answer</p>
                    <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[#172B2F] [overflow-wrap:anywhere]">
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
            className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-[#FCD34D] border-l-4 border-l-[#F59E0B] bg-[#FFFBEB] px-4 py-4"
        >
            <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#92400E]">
                    <Lightbulb size={17} aria-hidden="true" />
                </span>
                <h4 className="min-w-0 text-sm font-black uppercase tracking-[0.12em] text-[#92400E] [overflow-wrap:anywhere]">Explanation</h4>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-[#78350F] [overflow-wrap:anywhere]">{displayText}</p>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setIsExpanded((current) => !current)}
                    aria-expanded={isExpanded}
                    className="mt-3 min-h-12 rounded-[12px] px-1 text-sm font-black text-[#92400E] underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2"
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            )}
        </section>
    );
}

function TopicTags({ tags }: { tags: string[] }) {
    return (
        <section aria-label="Topics covered" className="min-w-0 max-w-full overflow-hidden rounded-[18px] border border-[rgba(23,43,47,0.08)] bg-[#EAF4F1] px-4 py-4">
            <p className="app-section-label">Topics covered</p>
            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="max-w-full rounded-[10px] border border-[#CFE2DE] bg-white px-3 py-2 text-xs font-bold text-[#315F59] [overflow-wrap:anywhere]"
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
        <div className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 overflow-hidden border-t border-[rgba(23,43,47,0.08)] pt-4 sm:gap-3">
            <button
                type="button"
                onClick={onPrevious}
                disabled={isFirstQuestion}
                aria-label="Previous question"
                className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] px-2.5 py-3 text-sm font-black text-[#172B2F] transition-colors hover:bg-[#EEF3F0] disabled:cursor-not-allowed disabled:bg-[#EEF3F0] disabled:text-[#809398] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#3F6F6A] focus:ring-offset-0 sm:gap-2 sm:px-3"
            >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
            </button>
            <button
                type="button"
                onClick={onNext}
                disabled={isLastQuestion}
                aria-label="Next question"
                className="inline-flex min-h-12 min-w-0 max-w-full items-center justify-center gap-1.5 overflow-hidden rounded-[14px] border border-[#CFE2DE] bg-[#EAF4F1] px-2.5 py-3 text-sm font-black text-[#234C48] transition-colors hover:bg-[#DDECE8] disabled:cursor-not-allowed disabled:border-[#DCE5E1] disabled:bg-[#EEF3F0] disabled:text-[#5E7479] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#3F6F6A] focus:ring-offset-0 sm:gap-2 sm:px-3"
            >
                Next
                <ChevronRight size={16} aria-hidden="true" />
            </button>
        </div>
    );
}

function buildReviewQuestions(
    attempt: AttemptSummary,
    questions: Question[],
    answers: Record<number, string>
): ReviewQuestion[] {
    const detailedAnswers = attempt.detailed_answers ?? {};

    if (Object.keys(detailedAnswers).length > 0) {
        return Object.entries(detailedAnswers).map(([questionId, detail]) =>
            normalizeDetailedAnswer(questionId, detail)
        );
    }

    return questions.map((question) => {
        const questionType = getResolvedQuestionType(question);
        const selectedOption = answers[question.id] ?? null;
        const correctOption = question.correct_option ?? null;
        const isUnanswered = !selectedOption?.trim() && questionType !== "matching";
        const canAutoGrade = questionType !== "essay" && questionType !== "matching" && Boolean(correctOption);
        const isCorrect = canAutoGrade
            ? normalizeAnswer(selectedOption) === normalizeAnswer(correctOption)
            : null;

        return {
            questionId: String(question.id),
            questionText: question.text,
            options: Object.fromEntries(getQuestionOptions(question)),
            selectedOption,
            correctOption,
            status: isUnanswered ? "unanswered" : isCorrect === null ? "not_graded" : isCorrect ? "correct" : "incorrect",
            explanation: question.explanation ?? null,
            topicTags: question.topic_tags?.length ? question.topic_tags : question.topic ? [question.topic] : [],
        };
    });
}

function normalizeDetailedAnswer(questionId: string, detail: AttemptAnswerDetail): ReviewQuestion {
    const selectedOption = detail.selected_option ?? null;
    const correctOption = detail.correct_option ?? null;
    const isUnanswered = !selectedOption?.trim();
    const status: ReviewStatus = isUnanswered
        ? "unanswered"
        : detail.is_correct === true
            ? "correct"
            : detail.is_correct === false
                ? "incorrect"
                : "not_graded";

    return {
        questionId,
        questionText: detail.question_text ?? `Question ${questionId}`,
        options: detail.options ?? {},
        selectedOption,
        correctOption,
        status,
        explanation: detail.explanation ?? null,
        topicTags: Array.isArray(detail.topic_tags) ? detail.topic_tags : [],
    };
}

function normalizeAnswer(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase();
}
