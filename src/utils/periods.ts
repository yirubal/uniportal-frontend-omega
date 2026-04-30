export type ProgramType = "regular" | "extension" | "distance";

export const YEAR_OPTIONS = [1, 2, 3, 4, 5];

export const PROGRAM_OPTIONS: Array<{ value: ProgramType; label: string; description: string }> = [
    {
        value: "regular",
        label: "Regular",
        description: "Two semesters per academic year.",
    },
    {
        value: "extension",
        label: "Extension",
        description: "Two semesters with extension scheduling.",
    },
    {
        value: "distance",
        label: "Distance",
        description: "Three terms per academic year.",
    },
];

export function getProgramLabel(program: ProgramType | null | undefined) {
    if (program === "extension") return "Extension";
    if (program === "distance") return "Distance";
    return "Regular";
}

export function getPeriodLabel(period: number | null | undefined, program: ProgramType | null | undefined) {
    if (!period) return "Period ?";

    if (program === "distance") {
        const labels: Record<number, string> = {
            1: "Term I",
            2: "Term II",
            3: "Term III",
        };

        return labels[period] ?? `Term ${period}`;
    }

    const labels: Record<number, string> = {
        1: "Semester I",
        2: "Semester II",
    };

    return labels[period] ?? `Semester ${period}`;
}

export function getPeriodOptions(program: ProgramType | null | undefined) {
    if (program === "distance") {
        return [
            { value: 1, label: "Term I" },
            { value: 2, label: "Term II" },
            { value: 3, label: "Term III" },
        ];
    }

    return [
        { value: 1, label: "Semester I" },
        { value: 2, label: "Semester II" },
    ];
}
