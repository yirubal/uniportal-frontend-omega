import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FileFormat } from "../utils/fileFormat";

/** A file the student opened in the in-app viewer, and where they were in it. */
export interface ReadingEntry {
    /** Telegram id of the student, so a shared phone never shows someone else's list. */
    ownerId: number;
    resourceId: number;
    title: string;
    format: FileFormat["kind"];
    extension: string | null;
    /** Last page in view (PDF only). */
    page: number | null;
    pageCount: number | null;
    openedAt: number;
}

const MAX_ENTRIES_PER_STUDENT = 12;

interface ReadingState {
    entries: ReadingEntry[];
    /** Moves the file to the front of the list (adding it if new); keeps its saved page. */
    recordOpen: (entry: Omit<ReadingEntry, "page" | "pageCount" | "openedAt">) => void;
    recordPage: (ownerId: number, resourceId: number, page: number, pageCount: number) => void;
    remove: (ownerId: number, resourceId: number) => void;
}

const sameItem = (entry: ReadingEntry, ownerId: number, resourceId: number) =>
    entry.ownerId === ownerId && entry.resourceId === resourceId;

export const useReadingStore = create<ReadingState>()(persist((set) => ({
    entries: [],

    recordOpen: (opened) => set((state) => {
        const existing = state.entries.find((entry) => sameItem(entry, opened.ownerId, opened.resourceId));
        const updated: ReadingEntry = {
            page: existing?.page ?? null,
            pageCount: existing?.pageCount ?? null,
            ...opened,
            openedAt: Date.now(),
        };
        const others = state.entries.filter((entry) => !sameItem(entry, opened.ownerId, opened.resourceId));
        const mine = others.filter((entry) => entry.ownerId === opened.ownerId).slice(0, MAX_ENTRIES_PER_STUDENT - 1);
        const theirs = others.filter((entry) => entry.ownerId !== opened.ownerId);
        return { entries: [updated, ...mine, ...theirs] };
    }),

    recordPage: (ownerId, resourceId, page, pageCount) => set((state) => ({
        entries: state.entries.map((entry) =>
            sameItem(entry, ownerId, resourceId) ? { ...entry, page, pageCount } : entry
        ),
    })),

    remove: (ownerId, resourceId) => set((state) => ({
        entries: state.entries.filter((entry) => !sameItem(entry, ownerId, resourceId)),
    })),
}), {
    name: "uniportal-reading",
    version: 1,
    storage: createJSONStorage(() => localStorage),
}));

/** The saved entry for one file, or undefined. */
export function getReadingEntry(ownerId: number | undefined, resourceId: number) {
    if (ownerId === undefined) return undefined;
    return useReadingStore.getState().entries.find((entry) => sameItem(entry, ownerId, resourceId));
}
