import { useMemo } from "react";

/** Very long text files are cut off to keep the page responsive. */
const MAX_CHARACTERS = 500_000;

/** Plain text (.txt), wrapped to the screen width. */
export default function TextView({ data }: { data: Uint8Array }) {
    const text = useMemo(() => new TextDecoder().decode(data), [data]);
    const truncated = text.length > MAX_CHARACTERS;

    return (
        <div className="min-h-0 flex-1 overflow-auto bg-white p-4" style={{ scrollBehavior: "auto" }}>
            <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-ink [overflow-wrap:anywhere]">
                {truncated ? text.slice(0, MAX_CHARACTERS) : text}
            </pre>
            {truncated && <p className="mt-3 text-xs font-semibold text-subtle">The file is long; download it to read the rest.</p>}
        </div>
    );
}
