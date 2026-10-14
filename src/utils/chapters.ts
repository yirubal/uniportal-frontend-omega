import type { SelectivePracticeChapter } from "../api/quiz";

export function getChapterDisplay(chapter: SelectivePracticeChapter) {
    return `Chapter ${chapter.number}`;
}

export function getChapterFilterValue(chapter: SelectivePracticeChapter) {
    if (chapter.filter_value) return chapter.filter_value;
    if (/^(chapter|ch)\s+\d+/i.test(chapter.title)) return chapter.title;
    return `Chapter ${chapter.number}: ${chapter.title}`;
}
