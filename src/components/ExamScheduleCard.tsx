import { ArrowRight, ClipboardList } from "lucide-react";
import type { ActiveTermResponse } from "../types/exams";
import { formatActiveTermLabel } from "../utils/examTerm";

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
            className="app-list-item border-accent-line bg-[linear-gradient(180deg,#F7FCFA_0%,#EAF4F1_100%)]"
        >
            <div className="app-icon-chip bg-accent-wash text-accent">
                <ClipboardList size={20} strokeWidth={2.2} />
            </div>

            <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                        Exam Schedule
                    </p>
                    <span className="inline-flex items-center justify-center rounded-full bg-accent-wash px-2.5 py-1 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                        Time-sensitive
                    </span>
                </div>
                <p className="mt-1 text-sm font-medium text-accent-deep">
                    {term ? formatActiveTermLabel(term) : "Check current exam schedule"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-subtle">
                    Tap to find your exam room
                </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-wash text-accent">
                <ArrowRight size={16} />
            </div>
        </button>
    );
}
