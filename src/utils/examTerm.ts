import type { ActiveTermResponse } from "../types/exams";

/** "2026 Term 2 · Main campus", or "Current term" when the year/term are unknown. */
export function formatActiveTermLabel(term: ActiveTermResponse, separator = " · ") {
    const termLabel =
        typeof term.year === "number" && typeof term.term === "number"
            ? `${term.year} Term ${term.term}`
            : "Current term";
    const centerLabel = term.center?.trim();

    return centerLabel ? `${termLabel}${separator}${centerLabel}` : termLabel;
}
