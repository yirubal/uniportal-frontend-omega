import { FileImage, FileSpreadsheet, FileText, FileType2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "../store/authStore";
import { type ReadingEntry, useReadingStore } from "../store/readingStore";

const MAX_SHOWN = 6;

const FORMAT_ICON: Record<ReadingEntry["format"], typeof FileText> = {
    pdf: FileText,
    docx: FileType2,
    sheet: FileSpreadsheet,
    image: FileImage,
    text: FileText,
    unsupported: FileText,
};

function describe(entry: ReadingEntry) {
    if (entry.format === "pdf" && entry.page && entry.pageCount) {
        return entry.page >= entry.pageCount ? "Finished" : `Page ${entry.page} of ${entry.pageCount}`;
    }
    return (entry.extension ?? entry.format).toUpperCase();
}

/** Files recently opened in the viewer, newest first; tapping one reopens it where it was left. */
export default function ContinueReading() {
    const navigate = useNavigate();
    const ownerId = useAuthStore((state) => state.student?.telegram_id);
    const remove = useReadingStore((state) => state.remove);
    const entries = useReadingStore(
        useShallow((state) => state.entries.filter((entry) => entry.ownerId === ownerId).slice(0, MAX_SHOWN))
    );

    if (ownerId === undefined || entries.length === 0) return null;

    return (
        <section className="mb-4" aria-labelledby="continue-reading-title">
            <p id="continue-reading-title" className="app-section-label mb-3 px-1">Continue reading</p>
            {/* Bleeds to the screen edges so cards scroll under the side padding. */}
            <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scroll-padding-inline:1.25rem]">
                {entries.map((entry) => {
                    const Icon = FORMAT_ICON[entry.format];
                    const progress = entry.page && entry.pageCount ? Math.min(1, entry.page / entry.pageCount) : null;
                    return (
                        <div key={entry.resourceId} className="relative w-[11.5rem] shrink-0 snap-start">
                            <button
                                type="button"
                                onClick={() => navigate(`/resources/${entry.resourceId}/read`)}
                                className="app-sheet app-card-interactive flex h-full w-full flex-col p-3.5 text-left"
                            >
                                <span className="app-icon-chip h-10 w-10 rounded-[14px]">
                                    <Icon size={18} />
                                </span>
                                <span className="mt-3 line-clamp-2 min-h-10 pr-4 text-sm font-semibold leading-snug text-ink [overflow-wrap:anywhere]">
                                    {entry.title}
                                </span>
                                <span className="mt-2 text-xs font-medium text-faint">{describe(entry)}</span>
                                {progress !== null && (
                                    <span className="mt-2 h-1.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
                                        <span className="block h-full rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                aria-label={`Remove ${entry.title} from Continue reading`}
                                onClick={() => remove(ownerId, entry.resourceId)}
                                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-faint"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
