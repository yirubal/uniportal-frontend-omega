import { useCallback, useEffect, useMemo, useState } from "react";
import type { AttemptSummary, Question } from "../store/quizStore";
import { buildReviewQuestions } from "../utils/answerReview";
import { QuestionDetailPanel, QuestionListPanel, ReviewShell } from "./answerReview/ReviewPanels";

interface AnswerReviewModalProps {
    attempt: AttemptSummary;
    questions: Question[];
    answers: Record<number, string>;
    onClose: () => void;
}

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
    const [rawSelectedIndex, setSelectedIndex] = useState(0);
    const totalQuestions = reviewQuestions.length;
    // Clamp instead of resetting in an effect: an out-of-range index (fewer questions) reads as the first.
    const selectedIndex = rawSelectedIndex < totalQuestions ? rawSelectedIndex : 0;
    const selectedQuestion = reviewQuestions[selectedIndex] ?? null;

    const goToPrevious = useCallback(() => {
        setSelectedIndex((current) => Math.max(current - 1, 0));
    }, []);

    const goToNext = useCallback(() => {
        setSelectedIndex((current) => Math.min(current + 1, totalQuestions - 1));
    }, [totalQuestions]);

    useEffect(() => {
        // Left/Right move between questions. Up/Down are left alone so the explanation can scroll;
        // Escape and Tab are handled by the dialog shell (useDialogFocus).
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                event.preventDefault();
                goToNext();
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                goToPrevious();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrevious]);

    if (!totalQuestions) {
        return (
            <ReviewShell
                onClose={onClose}
                progressLabel="No questions available"
            >
                <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[22px] bg-card px-5 text-center">
                    <p className="text-base font-bold text-ink">No answer details available</p>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
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
