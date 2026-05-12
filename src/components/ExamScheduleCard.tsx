import { ArrowRight, ClipboardList } from "lucide-react";
import type { ActiveTermResponse } from "../types/exams";

function formatActiveTermLabel(term: ActiveTermResponse) {
    const termLabel =
        typeof term.year === "number" && typeof term.term === "number"
            ? `${term.year} Term ${term.term}`
            : "Current term";
    const centerLabel = term.center?.trim();

    return centerLabel ? `${termLabel} · ${centerLabel}` : termLabel;
}

interface ExamScheduleCardProps {
    term?: ActiveTermResponse | null;
    onClick: () => void;
}

export default function ExamScheduleCard({
    term,
    onClick,
}: ExamScheduleCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="app-list-item border-[#CFE2DE] bg-[linear-gradient(180deg,#F7FCFA_0%,#EAF4F1_100%)]"
        >
            <div className="app-icon-chip bg-[#DDEEE9] text-[#3F6F6A]">
                <ClipboardList size={20} strokeWidth={2.2} />
            </div>

            <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[#172B2F]">
                        Exam Schedule
                    </p>
                    <span className="inline-flex items-center justify-center rounded-full bg-[#E4F1ED] px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#3F6F6A]">
                        Time-sensitive
                    </span>
                </div>
                <p className="mt-1 text-sm font-medium text-[#355D59]">
                    {term ? formatActiveTermLabel(term) : "Check current exam schedule"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#526B70]">
                    Tap to find your exam room
                </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E4F1ED] text-[#3F6F6A]">
                <ArrowRight size={16} />
            </div>
        </button>
    );
}
