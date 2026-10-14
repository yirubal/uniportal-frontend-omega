export default function SegmentedPicker<T extends string | number>({
    label,
    options,
    value,
    onSelect,
}: {
    label: string;
    options: { value: T; label: string }[];
    value: T | null;
    onSelect: (value: T) => void;
}) {
    return (
        <>
            <p className="mb-3 app-section-label">{label}</p>
            <div className="mb-5 flex gap-2">
                {options.map((item) => (
                    <button
                        type="button"
                        key={String(item.value)}
                        onClick={() => onSelect(item.value)}
                        className={`flex min-h-14 flex-1 items-center justify-center rounded-[20px] border px-3 py-3.5 text-sm font-bold transition-all duration-150 active:scale-95 ${
                            value === item.value
                                ? "border-[rgba(23,43,47,0.1)] bg-[rgba(255,255,255,0.96)] text-ink shadow-[0_8px_18px_rgba(23,43,47,0.08)]"
                                : "border-[rgba(23,43,47,0.08)] bg-[rgba(244,247,252,0.92)] text-subtle"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </>
    );
}
