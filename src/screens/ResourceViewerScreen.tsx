import { Download, Lock, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResourceDetail, requestDownload } from "../api/content";
import Button from "../components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import TopBackButton from "../components/TopBackButton";
import { useAccess } from "../hooks/useAccess";
import { useContentStore } from "../store/contentStore";
import type { Resource } from "../store/contentStore";
import { formatDate, formatFileType } from "../utils/format";

export default function ResourceViewerScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { resources, selectedCourse } = useContentStore();
    const { canAccessResource } = useAccess();

    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("Invalid resource.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        getResourceDetail(Number(id))
            .then(setResource)
            .catch(() => setError("Failed to load resource details."))
            .finally(() => setLoading(false));
    }, [id]);

    const relatedResources = useMemo(() => {
        if (!resource) return [];
        return resources.filter((item) => item.course === resource.course && item.id !== resource.id).slice(0, 3);
    }, [resource, resources]);

    const isLocked = resource ? !canAccessResource(resource.access_level) : false;

    const handleDownload = async () => {
        if (!resource || isLocked) {
            navigate("/subscribe");
            return;
        }

        setDownloading(true);
        setDownloadMessage(null);

        try {
            const response = await requestDownload(resource.id);
            setDownloadMessage(`Dummy download ready: ${response.filename}`);
        } catch {
            setDownloadMessage("Unable to prepare the download right now.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="app-screen px-5 pt-12">
                <Skeleton className="h-8 w-24 rounded-full mb-4" />
                <Skeleton className="h-56 rounded-[32px] mb-4" />
                <Skeleton className="h-48 rounded-[32px] mb-4" />
                <Skeleton className="h-40 rounded-[32px]" />
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-[#53627D]">
                        Back
                    </button>
                    <ErrorState message={error ?? "Resource not found."} onRetry={() => window.location.reload()} />
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-hero">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate(-1)} />
                    <p className="app-section-label text-white/70">
                        {formatFileType(resource.file_type)}
                    </p>
                    <h1 className="app-title mt-2 text-[1.9rem] font-bold text-white">
                        {resource.title}
                    </h1>
                    <p className="mt-3 text-sm text-white/72">
                        {selectedCourse?.code ? `${selectedCourse.code} · ` : ""}Updated {formatDate(resource.created_at)}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-tight space-y-4">
                <div className="app-panel rounded-[32px] p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${resource.access_level === "premium" ? "bg-[#FFF0ED] text-[#D95A50]" : "bg-[#EAF8F1] text-[#2E9E73]"}`}>
                            {resource.access_level === "premium" ? "Premium pack" : "Free resource"}
                        </span>
                        <span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4D6691]">
                            {resource.downloads_count} downloads
                        </span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-[#53627D]">
                        {resource.description ?? "Dummy resource details will be replaced by backend content later."}
                    </p>

                    <div className="mt-5 app-grid-2">
                        <MetaTile label="Pages" value={resource.pages ? String(resource.pages) : "N/A"} />
                        <MetaTile label="File size" value={resource.file_size_mb ? `${resource.file_size_mb} MB` : "N/A"} />
                        <MetaTile label="Read time" value={resource.estimated_minutes ? `${resource.estimated_minutes} min` : "N/A"} />
                        <MetaTile label="Author" value={resource.author ?? "UniPortal Team"} />
                    </div>

                    {!!resource.tags?.length && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {resource.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[11px] font-semibold text-[#4D6691]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="app-panel rounded-[32px] p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-[18px] bg-[#EDF2FF] p-3 text-[#2D5BFF]">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">Preview</p>
                            <p className="mt-1 text-base font-semibold text-[#18253D]">What this pack usually contains</p>
                        </div>
                    </div>

                    <div className="mt-4 app-panel-muted rounded-[24px] p-4">
                        <ul className="space-y-2 text-sm leading-relaxed text-[#53627D]">
                            <li>Concise topic summaries and worked examples.</li>
                            <li>Exam traps, key terms, and short revision cues.</li>
                            <li>Practice prompts aligned to the course outline.</li>
                        </ul>
                    </div>
                </div>

                {downloadMessage && (
                    <div className="rounded-[24px] bg-[#EAF8F1] px-4 py-4 text-sm font-semibold text-[#2E9E73]">
                        {downloadMessage}
                    </div>
                )}

                <div className="app-panel rounded-[32px] p-5">
                    <p className="app-section-label">Related resources</p>
                    {relatedResources.length === 0 ? (
                        <EmptyState
                            title="No related resources"
                            description="Related recommendations will appear here once you load more content for this course."
                        />
                    ) : (
                        <div className="mt-4 space-y-3">
                            {relatedResources.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(`/resources/${item.id}`)}
                                    className="app-panel-muted w-full rounded-[24px] p-4 text-left"
                                >
                                    <p className="text-sm font-semibold text-[#18253D]">{item.title}</p>
                                    <p className="mt-1 text-xs text-[#7F8CA5]">{formatFileType(item.file_type)}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="app-footer">
                <Button
                    variant={isLocked ? "secondary" : "primary"}
                    size="lg"
                    fullWidth
                    loading={downloading}
                    onClick={() => void handleDownload()}
                >
                    {isLocked ? <Lock size={16} /> : <Download size={16} />}
                    {isLocked ? "Unlock premium resource" : "Prepare dummy download"}
                </Button>
            </div>
        </div>
    );
}

function MetaTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="app-panel-muted rounded-[22px] p-4">
            <p className="app-section-label">{label}</p>
            <p className="mt-2 text-sm font-semibold text-[#18253D]">{value}</p>
        </div>
    );
}
