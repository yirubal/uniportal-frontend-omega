import { Download, FileWarning, Lock } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResourceDetail, requestDownload } from "../api/content";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { useAccess } from "../hooks/useAccess";
import { useResourceDownload } from "../hooks/useResourceDownload";
import type { Resource } from "../store/contentStore";
import { getErrorMessage } from "../utils/errors";
import { detectFileFormat, type FileFormat, getExtension } from "../utils/fileFormat";

// Each viewer brings its own library (pdf.js, docx-preview, read-excel-file); load only the one needed.
const PdfPageList = lazy(() => import("../components/pdf/PdfPageList"));
const DocxView = lazy(() => import("../components/viewers/DocxView"));
const SheetView = lazy(() => import("../components/viewers/SheetView"));
const ImageView = lazy(() => import("../components/viewers/ImageView"));
const TextView = lazy(() => import("../components/viewers/TextView"));

type ViewerState =
    | { status: "preparing" }
    | { status: "downloading"; progress: number | null }
    | { status: "ready"; data: Uint8Array; format: FileFormat; extension: string | null }
    | { status: "locked" }
    | { status: "error"; message: string };

/** Downloads the whole file with progress. Holding the bytes means a short-lived signed URL can't expire mid-read. */
async function fetchFileBytes(url: string, signal: AbortSignal, onProgress: (progress: number | null) => void) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`The file could not be downloaded (HTTP ${response.status}).`);

    const total = Number(response.headers.get("content-length")) || 0;
    const reader = response.body?.getReader();
    if (!reader) return new Uint8Array(await response.arrayBuffer());

    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        onProgress(total ? Math.min(1, received / total) : null);
    }
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    return bytes;
}

/** In-app viewer for resource files: PDF, Word (.docx), Excel (.xlsx), CSV, text and images. */
export default function DocumentViewerScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { canAccessResource } = useAccess();
    const { download, downloading, message: downloadMessage } = useResourceDownload();
    const [resource, setResource] = useState<Resource | null>(null);
    const [state, setState] = useState<ViewerState>({ status: "preparing" });
    const [reloadKey, setReloadKey] = useState(0);
    const resourceId = Number(id);

    useEffect(() => {
        if (!resourceId) {
            setState({ status: "error", message: "Invalid resource." });
            return;
        }

        const controller = new AbortController();
        const { signal } = controller;
        setState({ status: "preparing" });

        (async () => {
            try {
                const detail = await getResourceDetail(resourceId, { signal });
                if (signal.aborted) return;
                setResource(detail);

                if (detail.is_locked || !canAccessResource(detail.access_level)) {
                    setState({ status: "locked" });
                    return;
                }

                // Prefer the inline link from the resource itself: opening a file to read it should not count
                // as a download. Older API responses without it fall back to the download endpoint.
                const url = detail.file_url ?? (await requestDownload(resourceId)).url;
                if (signal.aborted) return;

                setState({ status: "downloading", progress: null });
                const data = await fetchFileBytes(url, signal, (progress) => {
                    if (!signal.aborted) setState({ status: "downloading", progress });
                });
                if (signal.aborted) return;

                const extension = detail.file_extension ?? getExtension(url);
                setState({ status: "ready", data, format: detectFileFormat(data, extension), extension });
            } catch (error) {
                if (signal.aborted) return;
                if (typeof error === "object" && error !== null && "status" in error && error.status === 403) {
                    setState({ status: "locked" });
                } else {
                    setState({ status: "error", message: getErrorMessage(error, "The file could not be opened.") });
                }
            }
        })();

        return () => controller.abort();
    // canAccessResource changes identity each render; access is re-checked on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resourceId, reloadKey]);

    const handleRenderError = useCallback((error: Error) => {
        setState({ status: "error", message: error.message || "This file could not be displayed." });
    }, []);

    const downloadButton = (variant: "primary" | "secondary") => (
        <Button variant={variant} size="md" fullWidth loading={downloading} onClick={() => void download(resourceId)}>
            <Download size={16} />
            Download file
        </Button>
    );

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate(-1)} label="Back" />
                    <p className="app-section-label">Reader</p>
                    <h1 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-ink [overflow-wrap:anywhere]">
                        {resource?.title ?? "Opening file"}
                    </h1>
                </div>
            </div>

            {state.status === "ready" && state.format.kind !== "unsupported" ? (
                <Suspense fallback={<LoadingPanel progress={1} preparing={false} />}>
                    {state.format.kind === "pdf" && <PdfPageList data={state.data} onLoadError={handleRenderError} />}
                    {state.format.kind === "docx" && <DocxView data={state.data} onError={handleRenderError} />}
                    {state.format.kind === "sheet" && (
                        <SheetView data={state.data} csv={state.extension === "csv"} onError={handleRenderError} />
                    )}
                    {state.format.kind === "image" && (
                        <ImageView data={state.data} mime={state.format.mime} alt={resource?.title ?? "Resource image"} />
                    )}
                    {state.format.kind === "text" && <TextView data={state.data} />}
                </Suspense>
            ) : (
                <div className="flex flex-1 items-center justify-center px-6 pb-16">
                    {state.status === "preparing" || state.status === "downloading" ? (
                        <LoadingPanel progress={state.status === "downloading" ? state.progress : null} preparing={state.status === "preparing"} />
                    ) : state.status === "locked" ? (
                        <MessagePanel
                            icon={<Lock size={22} />}
                            title="Premium resource"
                            description="Upgrade to premium to open this resource."
                            primary={<Button variant="primary" size="md" fullWidth onClick={() => navigate("/subscribe")}>See premium plans</Button>}
                        />
                    ) : state.status === "ready" && state.format.kind === "unsupported" ? (
                        <MessagePanel
                            icon={<FileWarning size={22} />}
                            title="Preview not available"
                            description={`${state.format.label} files can't be shown in the app yet. Download the file to open it on your phone.`}
                            primary={downloadButton("primary")}
                            note={downloadMessage?.text}
                        />
                    ) : state.status === "error" ? (
                        <MessagePanel
                            icon={<FileWarning size={22} />}
                            title="Couldn't open this file"
                            description={state.message}
                            primary={<Button variant="primary" size="md" fullWidth onClick={() => setReloadKey((key) => key + 1)}>Try again</Button>}
                            secondary={downloadButton("secondary")}
                            note={downloadMessage?.text}
                        />
                    ) : null}
                </div>
            )}
        </div>
    );
}

function LoadingPanel({ progress, preparing }: { progress: number | null; preparing: boolean }) {
    return (
        <div className="w-full max-w-xs px-6 py-10 text-center" role="status" aria-live="polite">
            <p className="text-sm font-semibold text-ink">
                {preparing ? "Preparing file..." : progress === null ? "Downloading..." : progress >= 1 ? "Opening..." : `Downloading ${Math.round(progress * 100)}%`}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(23,43,47,0.08)]">
                <div
                    className={`h-full rounded-full bg-accent transition-[width] duration-300 ${progress === null ? "w-1/3 animate-pulse" : ""}`}
                    style={progress === null ? undefined : { width: `${Math.max(4, progress * 100)}%` }}
                />
            </div>
        </div>
    );
}

function MessagePanel({
    icon,
    title,
    description,
    primary,
    secondary,
    note,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    primary: React.ReactNode;
    secondary?: React.ReactNode;
    note?: string;
}) {
    return (
        <div className="app-sheet w-full max-w-sm p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</div>
            <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle [overflow-wrap:anywhere]">{description}</p>
            <div className="mt-5 grid gap-2">
                {primary}
                {secondary}
            </div>
            {note && <p role="status" className="mt-3 text-xs font-semibold text-subtle">{note}</p>}
        </div>
    );
}
