import { Check } from "lucide-react";
import type { SelectivePracticeChapter } from "../../api/quiz";
import { getChapterDisplay } from "../../utils/chapters";

export default function ChapterSelector({
    chapters,
    selectedChapters,
    onToggleChapter,
}: {
    chapters: SelectivePracticeChapter[];
    selectedChapters: SelectivePracticeChapter[];
    onToggleChapter: (chapter: SelectivePracticeChapter) => void;
}) {
    const selectedPercent = chapters.length
        ? Math.round((selectedChapters.length / chapters.length) * 100)
        : 0;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-[16px] border border-edge bg-mist px-4 py-3">
                <p className="min-w-0 text-[15px] font-medium leading-[1.5] text-ink">
                    Select one or more chapters to practice.
                </p>
                <span className="shrink-0 rounded-[8px] bg-accent-soft px-3 py-2 text-[13px] font-bold text-accent-deep">
                    {selectedChapters.length || "Tap"} selected
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {chapters.map((chapter) => {
                    const selected = selectedChapters.some((item) => item.id === chapter.id);
                    const chapterDisplay = getChapterDisplay(chapter);

                    return (
                        <button
                            key={chapter.id}
                            type="button"
                            onClick={() => onToggleChapter(chapter)}
                            aria-pressed={selected}
                            aria-label={`${chapterDisplay}: ${chapter.title}, ${selected ? "selected" : "not selected"}`}
                            className={`flex min-h-[8.75rem] min-w-0 max-w-full flex-col items-stretch gap-3 overflow-visible rounded-[16px] border-2 p-4 text-left transition-all duration-150 active:scale-[0.985] ${
                                selected
                                    ? "border-fill bg-fill text-white shadow-[0_10px_24px_rgba(23,43,47,0.20)]"
                                    : "border-edge bg-card text-ink shadow-[0_8px_18px_rgba(23,43,47,0.04)]"
                            }`}
                            style={{
                                paddingTop: "1.125rem",
                                paddingInline: "0.75rem",
                            }}
                        >
                            <div
                                className="flex min-h-10 items-center justify-between gap-3"
                                style={{ paddingInlineStart: "1rem", paddingInlineEnd: "0.25rem" }}
                            >
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                                    selected
                                        ? "bg-[rgba(255,255,255,0.20)] text-white"
                                        : "bg-mist text-ink-soft"
                                }`}>
                                    {chapter.number}
                                </span>
                                <span className={`mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                    selected
                                        ? "bg-[rgba(255,255,255,0.24)] text-white"
                                        : "bg-transparent text-transparent"
                                }`}>
                                    <Check size={15} strokeWidth={3} aria-hidden="true" />
                                </span>
                            </div>

                            <div className="flex min-w-0 max-w-full flex-1 flex-col items-center justify-center overflow-hidden px-1 text-center">
                                <p className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-[1.4] ${
                                    selected ? "text-white" : "text-ink"
                                }`}
                                style={{
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>
                                    {chapterDisplay}
                                </p>
                                <p className={`mt-2 text-xs font-semibold ${
                                    selected ? "text-white/75" : "text-faint"
                                }`}>
                                    {chapter.question_count > 0
                                        ? `${chapter.question_count} questions`
                                        : "Questions available"}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedChapters.length > 0 && (
                <div className="rounded-[16px] border border-edge bg-card px-4 py-3">
                    <div className="h-2 overflow-hidden rounded-full bg-track">
                        <div
                            className="h-full rounded-full bg-navy transition-[width] duration-200"
                            style={{ width: `${selectedPercent}%` }}
                        />
                    </div>
                    <p className="mt-2 text-center text-[13px] font-medium text-steel">
                        {selectedPercent}% of chapters selected
                    </p>
                </div>
            )}
        </div>
    );
}
