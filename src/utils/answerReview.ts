import type { AttemptAnswerDetail, AttemptSummary, Question } from "../store/quizStore";
import { getQuestionOptions, getResolvedQuestionType } from "./questions";

export type ReviewStatus = "correct" | "incorrect" | "unanswered" | "not_graded";

export interface ReviewQuestion {
    questionId: string;
    questionText: string;
    options: Record<string, string>;
    selectedOption: string | null;
    correctOption: string | null;
    status: ReviewStatus;
    explanation: string | null;
    topicTags: string[];
}

/**
 * Review rows for an attempt: the backend's detailed_answers when present, otherwise rebuilt from the
 * questions and answers still held in the quiz store.
 */
export function buildReviewQuestions(
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

export function normalizeAnswer(value: string | null | undefined) {
    return (value ?? "").trim().toLowerCase();
}
