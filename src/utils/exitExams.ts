export type ExitExamCategory = "past_years" | "model";

export type ExitExamLike = {
    title?: string | null;
    exam_type?: string | null;
    exit_category?: string | null;
};

type ExitExamMeta = {
    label: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
    badgeLabel: string;
};

const EXIT_EXAM_META: Record<ExitExamCategory, ExitExamMeta> = {
    past_years: {
        label: "Past years exit exam",
        title: "Past years exit exams",
        description: "Review timed past-year exit exam papers and practice against earlier assessment styles.",
        emptyTitle: "No past years papers yet",
        emptyDescription: "Past years exit exam papers have not been added for your department yet.",
        badgeLabel: "Past years",
    },
    model: {
        label: "Exit exam model",
        title: "Exit exam models",
        description: "Use timed model papers designed to mirror the full exit exam experience.",
        emptyTitle: "No model papers yet",
        emptyDescription: "Exit exam model papers have not been added for your department yet.",
        badgeLabel: "Model",
    },
};

export const EXIT_EXAM_CATEGORIES: ExitExamCategory[] = [
    "past_years",
    "model",
];

export function getExitExamMeta(category: ExitExamCategory) {
    return EXIT_EXAM_META[category];
}

export function isExitExamCategory(value?: string | null): value is ExitExamCategory {
    return value === "past_years" || value === "model";
}

export function getExitExamCategory(exam?: ExitExamLike | null): ExitExamCategory {
    if (exam?.exit_category && isExitExamCategory(exam.exit_category)) {
        return exam.exit_category;
    }

    if (exam?.exam_type === "exit_real") {
        return "past_years";
    }
    if (exam?.exam_type === "exit_model") {
        return "model";
    }

    const title = exam?.title?.toLowerCase() ?? "";
    if (title.includes("past year") || title.includes("past years")) {
        return "past_years";
    }
    if (title.includes("model")) {
        return "model";
    }

    return "model";
}
