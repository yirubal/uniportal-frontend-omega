import type { Question } from "../store/quizStore";

export function getResolvedQuestionType(question: Question) {
    if (question.question_type) {
        return question.question_type;
    }

    return getQuestionOptions(question).length > 0 ? "mcq" : undefined;
}

export function getQuestionOptions(question: Question): Array<[string, string]> {
    if (question.available_options && Object.keys(question.available_options).length > 0) {
        return Object.entries(question.available_options).filter(([, label]) => Boolean(label));
    }

    const fallback: Record<string, string | undefined> = {
        a: question.option_a,
        b: question.option_b,
        c: question.option_c,
        d: question.option_d,
        e: question.option_e,
    };

    return Object.entries(fallback).filter(([, label]) => Boolean(label)) as Array<[string, string]>;
}

export function isOptionQuestion(question: Question) {
    const questionType = getResolvedQuestionType(question);
    return questionType === "mcq" || questionType === "true_false";
}

export function isQuestionAnswered(question: Question, answers: Record<number, string>) {
    const questionType = getResolvedQuestionType(question);

    if (questionType === "matching") {
        return true;
    }

    if (questionType === "fill_blank" || questionType === "essay") {
        return (answers[question.id] ?? "").trim().length > 0;
    }

    return Object.prototype.hasOwnProperty.call(answers, question.id);
}

export function buildSubmissionAnswers(questions: Question[], answers: Record<number, string>) {
    const submissionAnswers = { ...answers };

    questions.forEach((question) => {
        if (
            getResolvedQuestionType(question) === "matching" &&
            !Object.prototype.hasOwnProperty.call(submissionAnswers, question.id)
        ) {
            submissionAnswers[question.id] = "";
        }
    });

    return submissionAnswers;
}

export function splitMatchingPair(option: string) {
    const [left, ...rest] = option.split(/\s*(?:→|->)\s*/);

    return {
        left: left?.trim() ?? "",
        right: rest.join(" -> ").trim(),
    };
}
