import { FileWarning, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getWatermarkText } from "../api/auth";
import { getResourceDetail, requestDownload } from "../api/content";
import PdfPageList from "../components/pdf/PdfPageList";
import TopBackButton from "../components/TopBackButton";
import Button from "../components/ui/Button";
import { useAccess } from "../hooks/useAccess";
import { useAuthStore } from "../store/authStore";
import type { Resource } from "../store/contentStore";
import { getErrorMessage } from "../utils/errors";

type ReaderState =
    | { status: "preparing" }
    | { status: "downloading"; progress: number | null }
    | { status: "ready"; data: Uint8Array }
    | { status: "locked" }
    | { status: "not-pdf" }
    | { status: "error"; message: string };

class NotPdfError extends Error {}

/** Downloads the whole file with progress. Holding the bytes means a short-lived signed URL can't expire mid-read. */
async function fetchPdfBytes(url: string, signal: AbortSignal, onProgress: (progress: number | null) => void) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`The file could not be downloaded (HTTP ${response.status}).`);

    const total = Number(response.headers.get("content-length")) || 0;
    const reader = response.body?.getReader();
    let bytes: Uint8Array;

    if (!reader) {
        bytes = new Uint8Array(await response.arrayBuffer());
    } else {
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            onProgress(total ? Math.min(1, received / total) : null);
        }
        bytes = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
            bytes.set(chunk, offset);
            offset += chunk.length;
        }
    }

    // "%PDF" signature: other formats (docx, pptx, images) can't be shown by this reader.
    const signature = new TextDecoder().decode(bytes.subarray(0, 1024));
    if (!signature.includes("%PDF")) throw new NotPdfError();

    return bytes;
}

export default function PdfReaderScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const student = useAuthStore((state) => state.student);
    const { canAccessResource } = useAccess();
    const [resource, setResource] = useState<Resource | null>(null);
    const [state, setState] = useState<ReaderState>({ status: "preparing" });
    const [watermarkText, setWatermarkText] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const fallbackWatermark = [student?.name, student?.username ? `@${student.username}` : student?.telegram_id]
        .filter(Boolean)
        .join(" · ");
    const watermarkSubtext = useMemo(
        () => `UniPortal · ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`,
        []
    );

    useEffect(() => {
        const resourceId = Number(id);
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

                // The same text is sent to the backend so a server-side watermark matches the on-screen one.
                const watermark = await getWatermarkText().catch(() => undefined);
                if (signal.aborted) return;
                if (watermark) setWatermarkText(watermark);

                const { url } = await requestDownload(resourceId, watermark);
                if (signal.aborted) return;

                setState({ status: "downloading", progress: null });
                const data = await fetchPdfBytes(url, signal, (progress) => {
                    if (!signal.aborted) setState({ status: "downloading", progress });
                });
                if (!signal.aborted) setState({ status: "ready", data });
            } catch (error) {
                if (signal.aborted) return;
                if (error instanceof NotPdfError) {
                    setState({ status: "not-pdf" });
                } else if (typeof error === "object" && error !== null && "status" in error && error.status === 403) {
                    setState({ status: "locked" });
                } else {
                    setState({ status: "error", message: getErrorMessage(error, "The document could not be opened.") });
                }
            }
        })();

        return () => controller.abort();
    // canAccessResource changes identity each render; access is re-checked on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, reloadKey]);

    const handleRenderError = useCallback((error: Error) => {
        setState({ status: "error", message: error.message || "This PDF could not be displayed." });
    }, []);

    const backToDetail = () => navigate(`/resources/${id}`, { replace: true });

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate(-1)} label="Back" />
                    <p className="app-section-label">Reader</p>
                    <h1 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-ink">
                        {resource?.title ?? "Opening document"}
                    </h1>
                </div>
            </div>

            {state.status === "ready" ? (
                <PdfPageList
                    data={state.data}
                    watermarkText={watermarkText || fallbackWatermark || "UniPortal"}
                    watermarkSubtext={watermarkSubtext}
                    onLoadError={handleRenderError}
                />
            ) : (
                <div className="flex flex-1 items-center justify-center px-6 pb-16">
                    {state.status === "preparing" || state.status === "downloading" ? (
                        <LoadingPanel progress={state.status === "downloading" ? state.progress : null} preparing={state.status === "preparing"} />
                    ) : state.status === "locked" ? (
                        <MessagePanel
                            icon={<Lock size={22} />}
                            title="Premium resource"
                            description="Upgrade to premium to read this resource in the app."
                            primary={{ label: "See premium plans", onClick: () => navigate("/subscribe") }}
                            secondary={{ label: "Back", onClick: backToDetail }}
                        />
                    ) : state.status === "not-pdf" ? (
                        <MessagePanel
                            icon={<FileWarning size={22} />}
                            title="Preview not available"
                            description="This file isn't a PDF, so it can't be opened in the reader. Download it instead."
                            primary={{ label: "Back to download", onClick: backToDetail }}
                        />
                    ) : (
                        <MessagePanel
                            icon={<FileWarning size={22} />}
                            title="Couldn't open this document"
                            description={state.message}
                            primary={{ label: "Try again", onClick: () => setReloadKey((key) => key + 1) }}
                            secondary={{ label: "Download instead", onClick: backToDetail }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function LoadingPanel({ progress, preparing }: { progress: number | null; preparing: boolean }) {
    return (
        <div className="w-full max-w-xs text-center" role="status" aria-live="polite">
            <p className="text-sm font-semibold text-ink">
                {preparing ? "Preparing document..." : progress === null ? "Downloading..." : `Downloading ${Math.round(progress * 100)}%`}
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
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    primary: { label: string; onClick: () => void };
    secondary?: { label: string; onClick: () => void };
}) {
    return (
        <div className="app-sheet w-full max-w-sm p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">{icon}</div>
            <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-subtle">{description}</p>
            <div className="mt-5 grid gap-2">
                <Button variant="primary" size="md" fullWidth onClick={primary.onClick}>
                    {primary.label}
                </Button>
                {secondary && (
                    <Button variant="secondary" size="md" fullWidth onClick={secondary.onClick}>
                        {secondary.label}
                    </Button>
                )}
            </div>
        </div>
    );
}
