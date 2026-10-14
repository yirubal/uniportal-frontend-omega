import { EmptyState, SearchInput, Skeleton } from "./ui";

/** Searchable single-choice list (e.g. departments) with a "Selected" chip on the chosen item. */
export default function SelectorGroup<T>({
    label,
    loading,
    items,
    value,
    onSelect,
    getKey,
    getLabel,
    getMeta,
    searchValue,
    onSearchChange,
    searchPlaceholder,
}: {
    label: string;
    loading: boolean;
    items: T[];
    value: number | null;
    onSelect: (item: T) => void;
    getKey: (item: T) => number;
    getLabel: (item: T) => string;
    getMeta: (item: T) => string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
}) {
    return (
        <div>
            <p className="app-section-label mb-3">{label}</p>
            {onSearchChange && (
                <div className="mb-3 app-sheet p-4">
                    <SearchInput value={searchValue ?? ""} onChange={onSearchChange} placeholder={searchPlaceholder ?? "Search"} />
                </div>
            )}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((item) => <Skeleton key={item} className="h-20 rounded-[28px]" />)}
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    title="No departments found"
                    description="Try a different search term to find your department."
                />
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <button
                            key={getKey(item)}
                            onClick={() => onSelect(item)}
                            style={{ paddingInline: "1.25rem" }}
                            className={`app-panel flex min-h-[5rem] w-full items-center justify-between gap-3 overflow-hidden rounded-[16px] px-5 py-3 text-left ${value === getKey(item) ? "ring-2 ring-accent/20" : ""}`}
                        >
                            <div className="min-w-0 flex-1 pr-3">
                                <p className="text-base font-semibold leading-snug text-ink">{getLabel(item)}</p>
                                <p className="mt-1 text-sm text-faint">{getMeta(item)}</p>
                            </div>
                            <div className={`flex-shrink-0 self-center rounded-full px-3 py-2 text-xs font-bold ${value === getKey(item) ? "tone-blue" : "bg-mist text-faint"}`}>
                                {value === getKey(item) ? "Selected" : "Choose"}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
