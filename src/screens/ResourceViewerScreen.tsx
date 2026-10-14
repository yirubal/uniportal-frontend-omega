import { BookOpen, Download, Lock, Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getResourceDetail } from "../api/content";
import Button from "../components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { ResourceSourceBadge } from "../components/ResourceSourceBadge";
import TopBackButton from "../components/TopBackButton";
import { useAccess } from "../hooks/useAccess";
import { useAsyncData } from "../hooks/useAsyncData";
import { useResourceDownload } from "../hooks/useResourceDownload";
import { useContentStore } from "../store/contentStore";
import { formatDate, formatFileType } from "../utils/format";

export default function ResourceViewerScreen() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { resources, selectedCourse } = useContentStore(
        useShallow((state) => ({
            resources: state.resources,
            selectedCourse: state.selectedCourse,
        }))
    );
    const { canAccessResource } = useAccess();
    const { download, downloading, message: downloadMessage } = useResourceDownload();

    // Keyed by id: moving to a related resource aborts the previous request and shows loading at once.
    const resourceId = Number(id);
    const detail = useAsyncData(resourceId ? String(resourceId) : null, (signal) => getResourceDetail(resourceId, { signal }));
    const resource = detail.data;
    const loading = detail.loading;
    const error = !resourceId ? "Invalid resource." : detail.error ? "Failed to load resource details." : null;

    const relatedResources = useMemo(() => {
        if (!resource) return [];
        const courseCodes = resource.course_codes ?? [];

        return resources
            .filter((item) => {
                if (item.id === resource.id) return false;
                const itemCourseCodes = item.course_codes ?? [];
                return courseCodes.some((code) => itemCourseCodes.includes(code));
            })
            .slice(0, 3);
    }, [resource, resources]);

    const isLocked = resource ? resource.is_locked || !canAccessResource(resource.access_level) : false;

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
                    <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-subtle">
                        Back
                    </button>
                    <ErrorState message={error ?? "Resource not found."} onRetry={detail.reload} />
                </div>
            </div>
        );
    }

    const source = resource.source ?? "other";
    const sourceDisplay = resource.source_display ?? "Other Resource";

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate(-1)} />
                    <p className="app-section-label">
                        {formatFileType(resource.file_type)}
                    </p>
                    <h1 className="app-title mt-2 text-[1.55rem] font-bold text-ink">
                        {resource.title}
                    </h1>
                    <p className="mt-2 text-sm text-subtle">
                        {selectedCourse?.code ? `${selectedCourse.code} · ` : ""}Updated {formatDate(resource.created_at)}
                    </p>
                    <div className="mt-3">
                        <ResourceSourceBadge source={source} source_display={sourceDisplay} />
                    </div>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact space-y-4">
                <div className="app-sheet p-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`app-badge ${resource.access_level === "premium" ? "app-badge-coral" : "app-badge-green"}`}>
                            {resource.access_level === "premium" ? "Premium pack" : "Free resource"}
                        </span>
                        <span className="app-badge app-badge-blue">
                            {resource.downloads_count} downloads
                        </span>
                        <ResourceSourceBadge source={source} source_display={sourceDisplay} />
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-subtle">
                        {resource.description ?? "No description has been added for this resource yet."}
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
                                <span key={tag} className="app-badge app-badge-blue !text-[0.68rem]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="app-sheet p-5">
                    <div className="flex items-center gap-3">
                        <div className="app-icon-chip">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="app-section-label">Preview</p>
                            <p className="mt-1 text-base font-semibold text-ink">What this pack usually contains</p>
                        </div>
                    </div>

                    <div className="mt-4 app-panel-muted rounded-[24px] p-4">
                        <ul className="space-y-2 text-sm leading-relaxed text-subtle">
                            <li>Concise topic summaries and worked examples.</li>
                            <li>Exam traps, key terms, and short revision cues.</li>
                            <li>Practice prompts aligned to the course outline.</li>
                        </ul>
                    </div>
                </div>

                {downloadMessage && (
                    <div
                        role={downloadMessage.tone === "error" ? "alert" : "status"}
                        className={`rounded-[20px] px-4 py-4 text-sm font-semibold ${downloadMessage.tone === "error" ? "bg-coral-soft text-[#B4473F]" : "bg-[rgba(230,242,237,0.96)] text-[#2E7C62]"}`}
                    >
                        {downloadMessage.text}
                    </div>
                )}

                <div className="app-sheet p-5">
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
                                    className="app-list-item"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <p className="text-xs text-faint">{formatFileType(item.file_type)}</p>
                                            <ResourceSourceBadge
                                                source={item.source ?? "other"}
                                                source_display={item.source_display ?? "Other Resource"}
                                            />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="app-footer">
                {isLocked ? (
                    <Button variant="secondary" size="lg" fullWidth onClick={() => navigate("/subscribe")}>
                        <Lock size={16} />
                        Unlock premium resource
                    </Button>
                ) : (
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/resources/${resource.id}/read`)}>
                            <BookOpen size={16} />
                            Read in app
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            aria-label="Download resource"
                            loading={downloading}
                            onClick={() => void download(resource.id)}
                            className="px-4"
                        >
                            <Download size={16} />
                        </Button>
                    </div>
                )}
                {source !== "official" && (
                    <p className="mt-2 text-center text-xs font-medium leading-relaxed text-faint">
                        ℹ️ {sourceDisplay} - not an official Unity University document
                    </p>
                )}
            </div>
        </div>
    );
}

function MetaTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="app-panel-muted rounded-[20px] p-4">
            <p className="app-section-label">{label}</p>
            <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
        </div>
    );
}
