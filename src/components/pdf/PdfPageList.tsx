import { ChevronDown, ChevronUp, Minus, Plus, ScanLine } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import Watermark from "../Watermark";

// Legacy build (see vite.config.js alias): the modern pdf.js build needs APIs that older Telegram WebViews lack.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const DOCUMENT_OPTIONS = {
    // Fonts and character maps for PDFs that don't embed them, matched to the bundled pdf.js version.
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    isEvalSupported: false,
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;
const PAGE_GAP = 12;
const SIDE_PADDING = 12;
const DEFAULT_ASPECT = 842 / 595; // A4 portrait, until the real page size is known
/** Max canvas pixels per page, so deep zoom on a high-DPI phone can't exhaust WebView memory. */
const PAGE_PIXEL_BUDGET = 4_000_000;

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

interface PdfPageListProps {
    data: Uint8Array;
    watermarkText: string;
    watermarkSubtext: string;
    onLoadError: (error: Error) => void;
}

export default function PdfPageList({ data, watermarkText, watermarkSubtext, onLoadError }: PdfPageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const [aspects, setAspects] = useState<Record<number, number>>({});
    const [zoom, setZoom] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState<string | null>(null);
    const scrollRatioRef = useRef<number | null>(null);

    // pdf.js transfers the buffer to its worker; pass a stable copy so re-renders never hand it a detached one.
    const file = useMemo(() => ({ data: data.slice() }), [data]);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const pageWidth = Math.max(0, (containerWidth - SIDE_PADDING * 2) * zoom);

    // Top offset and height of every page, so off-screen pages can be placeholders of the right size.
    const layout = useMemo(() => {
        const tops: number[] = [];
        const heights: number[] = [];
        let y = SIDE_PADDING;
        for (let page = 1; page <= numPages; page += 1) {
            const height = pageWidth * (aspects[page] ?? aspects[1] ?? DEFAULT_ASPECT);
            tops.push(y);
            heights.push(height);
            y += height + PAGE_GAP;
        }
        return { tops, heights, totalHeight: y };
    }, [aspects, numPages, pageWidth]);

    const updateCurrentPage = useCallback(() => {
        const element = scrollRef.current;
        if (!element || layout.tops.length === 0) return;

        // The page crossing a line 30% down the viewport counts as the one being read.
        const line = element.scrollTop + element.clientHeight * 0.3;
        let low = 0;
        let high = layout.tops.length - 1;
        while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            if (layout.tops[mid] <= line) low = mid;
            else high = mid - 1;
        }
        setCurrentPage(low + 1);
    }, [layout]);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        let frame = 0;
        const handleScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updateCurrentPage);
        };
        element.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            element.removeEventListener("scroll", handleScroll);
            cancelAnimationFrame(frame);
        };
    }, [updateCurrentPage]);

    const changeZoom = useCallback((next: number) => {
        const element = scrollRef.current;
        if (element && element.scrollHeight > 0) {
            // Remember the reading position so zooming doesn't jump to another page.
            scrollRatioRef.current = (element.scrollTop + element.clientHeight * 0.3) / element.scrollHeight;
        }
        setZoom(clampZoom(next));
    }, []);

    useLayoutEffect(() => {
        const element = scrollRef.current;
        if (!element || scrollRatioRef.current === null) return;
        element.scrollTop = scrollRatioRef.current * element.scrollHeight - element.clientHeight * 0.3;
        scrollRatioRef.current = null;
    }, [layout.totalHeight]);

    // Pinch to zoom: preview with a CSS transform while the fingers move, re-render pages once at the end.
    useEffect(() => {
        const element = scrollRef.current;
        const content = contentRef.current;
        if (!element || !content) return;

        let startDistance = 0;
        let scale = 1;
        const distance = (touches: TouchList) =>
            Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

        const handleStart = (event: TouchEvent) => {
            if (event.touches.length === 2) {
                startDistance = distance(event.touches);
                scale = 1;
                content.style.transformOrigin = `${element.scrollLeft + element.clientWidth / 2}px ${element.scrollTop + element.clientHeight / 2}px`;
            }
        };
        const handleMove = (event: TouchEvent) => {
            if (event.touches.length !== 2 || !startDistance) return;
            event.preventDefault(); // stop the WebView from zooming the whole app
            scale = distance(event.touches) / startDistance;
            content.style.transform = `scale(${scale})`;
        };
        const handleEnd = () => {
            if (!startDistance) return;
            startDistance = 0;
            content.style.transform = "";
            setZoom((current) => {
                const next = clampZoom(Math.round(current * scale * 4) / 4);
                if (next !== current && element.scrollHeight > 0) {
                    scrollRatioRef.current = (element.scrollTop + element.clientHeight * 0.3) / element.scrollHeight;
                }
                return next;
            });
        };

        element.addEventListener("touchstart", handleStart, { passive: true });
        element.addEventListener("touchmove", handleMove, { passive: false });
        element.addEventListener("touchend", handleEnd);
        element.addEventListener("touchcancel", handleEnd);
        return () => {
            element.removeEventListener("touchstart", handleStart);
            element.removeEventListener("touchmove", handleMove);
            element.removeEventListener("touchend", handleEnd);
            element.removeEventListener("touchcancel", handleEnd);
        };
    }, []);

    const scrollToPage = (page: number) => {
        const element = scrollRef.current;
        const target = Math.min(Math.max(page, 1), numPages);
        if (!element || !layout.tops.length) return;
        element.scrollTo({ top: layout.tops[target - 1] - SIDE_PADDING, behavior: "smooth" });
    };

    // Only pages near the reading position get a canvas; the rest are sized placeholders.
    const renderRadius = zoom > 1.5 ? 1 : 2;
    const firstRendered = Math.max(1, currentPage - renderRadius);
    const lastRendered = Math.min(numPages, currentPage + renderRadius + 1);
    const deviceRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[#E4EAE7]"
                style={{ WebkitTouchCallout: "none", userSelect: "none", WebkitUserSelect: "none" }}
                onContextMenu={(event) => event.preventDefault()}
                onDoubleClick={() => changeZoom(zoom > 1 ? 1 : 2)}
            >
                <div
                    ref={contentRef}
                    className="relative mx-auto"
                    style={{ width: pageWidth + SIDE_PADDING * 2, height: layout.totalHeight || "100%" }}
                >
                    <Document
                        file={file}
                        options={DOCUMENT_OPTIONS}
                        loading={null}
                        onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                        onLoadError={onLoadError}
                    >
                        {pageWidth > 0 && layout.tops.map((top, index) => {
                            const pageNumber = index + 1;
                            const height = layout.heights[index];
                            const shouldRender = pageNumber >= firstRendered && pageNumber <= lastRendered;
                            const pixelRatio = Math.min(deviceRatio, Math.sqrt(PAGE_PIXEL_BUDGET / Math.max(1, pageWidth * height)));

                            return (
                                <div
                                    key={pageNumber}
                                    className="absolute overflow-hidden rounded-[6px] bg-white shadow-[0_2px_10px_rgba(23,43,47,0.12)]"
                                    style={{ top, left: SIDE_PADDING, width: pageWidth, height }}
                                >
                                    {shouldRender ? (
                                        <Page
                                            pageNumber={pageNumber}
                                            width={pageWidth}
                                            devicePixelRatio={pixelRatio}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            loading={<PagePlaceholder pageNumber={pageNumber} />}
                                            onLoadSuccess={(page) => {
                                                const aspect = page.originalHeight / page.originalWidth;
                                                setAspects((current) =>
                                                    current[pageNumber] === aspect ? current : { ...current, [pageNumber]: aspect }
                                                );
                                            }}
                                        />
                                    ) : (
                                        <PagePlaceholder pageNumber={pageNumber} />
                                    )}
                                    <Watermark text={watermarkText} subtext={watermarkSubtext} />
                                </div>
                            );
                        })}
                    </Document>
                </div>
            </div>

            {numPages > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] flex justify-center px-3">
                    <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[rgba(23,43,47,0.92)] p-1 text-white shadow-[0_10px_30px_rgba(10,22,40,0.28)] backdrop-blur">
                        <ToolbarButton label="Previous page" disabled={currentPage <= 1} onClick={() => scrollToPage(currentPage - 1)}>
                            <ChevronUp size={18} />
                        </ToolbarButton>
                        {pageInput === null ? (
                            <button
                                type="button"
                                aria-label={`Page ${currentPage} of ${numPages}. Tap to jump to a page`}
                                onClick={() => setPageInput(String(currentPage))}
                                className="min-h-10 min-w-[4.5rem] rounded-full px-3 text-sm font-bold tabular-nums"
                            >
                                {currentPage} / {numPages}
                            </button>
                        ) : (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    scrollToPage(Number(pageInput));
                                    setPageInput(null);
                                }}
                            >
                                <input
                                    autoFocus
                                    aria-label="Go to page"
                                    inputMode="numeric"
                                    value={pageInput}
                                    onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))}
                                    onBlur={() => setPageInput(null)}
                                    className="h-10 w-[4.5rem] rounded-full bg-white/15 text-center text-sm font-bold text-white outline-none"
                                />
                            </form>
                        )}
                        <ToolbarButton label="Next page" disabled={currentPage >= numPages} onClick={() => scrollToPage(currentPage + 1)}>
                            <ChevronDown size={18} />
                        </ToolbarButton>
                        <span className="mx-1 h-6 w-px bg-white/20" />
                        <ToolbarButton label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => changeZoom(zoom - ZOOM_STEP)}>
                            <Minus size={18} />
                        </ToolbarButton>
                        <ToolbarButton label="Fit to width" disabled={zoom === 1} onClick={() => changeZoom(1)}>
                            <ScanLine size={16} />
                        </ToolbarButton>
                        <ToolbarButton label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => changeZoom(zoom + ZOOM_STEP)}>
                            <Plus size={18} />
                        </ToolbarButton>
                    </div>
                </div>
            )}
        </div>
    );
}

function PagePlaceholder({ pageNumber }: { pageNumber: number }) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-white text-xs font-semibold text-[#9AA9AD]">
            Page {pageNumber}
        </div>
    );
}

function ToolbarButton({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors active:bg-white/15 disabled:opacity-35"
        >
            {children}
        </button>
    );
}
