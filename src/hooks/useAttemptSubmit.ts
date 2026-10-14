import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitAttempt } from "../api/quiz";
import { type QuizMode, useQuizStore } from "../store/quizStore";
import { getErrorMessage } from "../utils/errors";
import { buildSubmissionAnswers } from "../utils/questions";

interface AttemptSubmitOptions {
    /** Paper being answered; undefined for selective practice (graded from the questions themselves). */
    examPaperId: number | undefined;
    mode: QuizMode;
    /** Send the questions with the attempt (needed when there is no paper, i.e. selective practice). */
    includeQuestions?: boolean;
    fallbackError: string;
}

/**
 * Submits the attempt held in the quiz store, shared by practice and exit-exam screens:
 * a ref guard against double submits, an error the screen shows with a retry, and navigation to
 * Results only after the backend has graded it.
 */
export function useAttemptSubmit({ examPaperId, mode, includeQuestions = false, fallbackError }: AttemptSubmitOptions) {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    // State-based guards can be stale between rapid taps, auto-advance and the exam expiry auto-submit.
    const submittingRef = useRef(false);

    const submit = useCallback(async () => {
        if (submittingRef.current) return;

        // Read live store values: answers may have changed since the last render.
        const { questions, answers, completeQuiz } = useQuizStore.getState();

        submittingRef.current = true;
        setSubmitting(true);
        setSubmitError(null);

        try {
            const result = await submitAttempt({
                exam_paper: examPaperId,
                answers: Object.fromEntries(
                    Object.entries(buildSubmissionAnswers(questions, answers)).map(([questionId, answer]) => [String(questionId), answer])
                ),
                mode,
                ...(includeQuestions ? { questions } : {}),
            });

            completeQuiz(result);
            // Navigate from here, not from an isComplete effect: a finished attempt is persisted and
            // must not redirect the next visit to an old result.
            navigate("/results", { replace: true });
        } catch (error) {
            // Stay on the attempt: the answers were not saved, so showing a result would be wrong.
            setSubmitError(getErrorMessage(error, fallbackError));
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    }, [examPaperId, fallbackError, includeQuestions, mode, navigate]);

    return { submit, submitting, submitError };
}
