import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ZOOMS = [1, 1.5, 2, 3];

/** An image fitted to the screen width, with zoom steps; the container scrolls when zoomed. */
export default function ImageView({ data, mime, alt }: { data: Uint8Array; mime: string; alt: string }) {
    const url = useMemo(() => URL.createObjectURL(new Blob([data.slice()], { type: mime })), [data, mime]);
    useEffect(() => () => URL.revokeObjectURL(url), [url]);
    const [zoomIndex, setZoomIndex] = useState(0);

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-auto bg-[#E4EAE7] p-3" style={{ scrollBehavior: "auto" }}>
                <img src={url} alt={alt} className="mx-auto block h-auto max-w-none rounded-[6px] bg-white" style={{ width: `${ZOOMS[zoomIndex] * 100}%` }} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] flex justify-center">
                <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[rgba(23,43,47,0.92)] p-1 text-white">
                    <button type="button" aria-label="Zoom out" disabled={zoomIndex === 0} onClick={() => setZoomIndex((i) => i - 1)} className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-35">
                        <Minus size={18} />
                    </button>
                    <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums">{Math.round(ZOOMS[zoomIndex] * 100)}%</span>
                    <button type="button" aria-label="Zoom in" disabled={zoomIndex === ZOOMS.length - 1} onClick={() => setZoomIndex((i) => i + 1)} className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-35">
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
