import { useMemo, useState } from "react";
import { useAccess } from "../../hooks/useAccess";
import { useContentStore } from "../../store/contentStore";
import type { Course, ResourceFilterType, ResourceSource } from "../../store/contentStore";
import ResourceCard from "../ResourceCard";
import { ResourceSourceBadge } from "../ResourceSourceBadge";
import TopBackButton from "../TopBackButton";
import { EmptyState, ErrorState, SearchInput, Skeleton } from "../ui";

type FilterType = ResourceFilterType;
type SourceFilter = "All" | ResourceSource;
const INTERACTIVE_RESOURCE_TYPES = new Set<FilterType>(["past_exam", "exit_exam"]);

const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: "All", label: "All" },
    { key: "lecture_note", label: "Notes" },
    { key: "worksheet", label: "Worksheets" },
];

const SOURCE_FILTER_TABS: { key: SourceFilter; label: string }[] = [
    { key: "All", label: "All sources" },
    { key: "official", label: "Official" },
    { key: "textbook", label: "Textbooks" },
    { key: "reference", label: "Reference" },
    { key: "notes", label: "Study notes" },
    { key: "other", label: "Other" },
];

interface ResourceShelfProps {
    course: Course | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    onBack: () => void;
}

/** One course's resources: stats, most-downloaded pick, search and type/source filters. */
export default function ResourceShelf({ course, loading, error, onRetry, onBack }: ResourceShelfProps) {
    const resources = useContentStore((state) => state.resources);
    const { canAccessResource } = useAccess();
    const [filterType, setFilterType] = useState<FilterType>("All");
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
    const [search, setSearch] = useState("");

    const visibleResources = useMemo(() => {
        return resources.filter((resource) => !INTERACTIVE_RESOURCE_TYPES.has(resource.file_type));
    }, [resources]);

    const filteredResources = useMemo(() => {
        return visibleResources.filter((resource) => {
            const matchesType = filterType === "All" || resource.file_type === filterType;
            const resourceSource = resource.source ?? "other";
            const matchesSource = sourceFilter === "All" || resourceSource === sourceFilter;
            const query = search.trim().toLowerCase();
            const matchesSearch = !query ||
                resource.title.toLowerCase().includes(query) ||
                resource.description?.toLowerCase().includes(query) ||
                resource.source_display?.toLowerCase().includes(query) ||
                resource.tags?.some((tag) => tag.toLowerCase().includes(query));

            return matchesType && matchesSource && matchesSearch;
        });
    }, [filterType, search, sourceFilter, visibleResources]);

    const resourceStats = useMemo(() => {
        const total = visibleResources.length;
        const notes = visibleResources.filter((item) => item.file_type === "lecture_note").length;
        const premium = visibleResources.filter((item) => item.access_level === "premium").length;
        const recent = visibleResources.filter((item) => isRecent(item.created_at)).length;
        return { total, notes, premium, recent };
    }, [visibleResources]);

    const featuredResource = useMemo(() => {
        return [...visibleResources].sort((a, b) => b.downloads_count - a.downloads_count)[0] ?? null;
    }, [visibleResources]);

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={onBack} />
                    <p className="app-section-label">{course?.code}</p>
                    <h1 className="app-title mt-2 text-[1.55rem] font-bold text-[#172B2F]">{course?.name ?? "Resources"}</h1>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-grid-2">
                    <MetricCard label="Resources" value={resourceStats.total} tone="tone-blue" />
                    <MetricCard label="Fresh" value={resourceStats.recent} tone="tone-green" />
                    <MetricCard label="Notes" value={resourceStats.notes} tone="tone-gold" />
                    <MetricCard label="Premium" value={resourceStats.premium} tone="tone-purple" />
                </div>

                {featuredResource && (
                    <div className="mt-4 app-sheet overflow-hidden p-5">
                        <p className="app-section-label">Featured pack</p>
                        <div className="mt-3 flex min-w-0 items-start gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="min-w-0">
                                    <p
                                        className="line-clamp-2 overflow-hidden text-base font-semibold leading-snug text-[#172B2F]"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {featuredResource.title}
                                    </p>
                                    <div className="mt-2">
                                        <ResourceSourceBadge
                                            source={featuredResource.source ?? "other"}
                                            source_display={featuredResource.source_display ?? "Other Resource"}
                                            size="xs"
                                        />
                                    </div>
                                </div>
                                <p
                                    className="mt-2 line-clamp-2 overflow-hidden text-sm leading-relaxed text-[#526B70]"
                                    style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflowWrap: "anywhere",
                                    }}
                                >
                                    {featuredResource.description}
                                </p>
                            </div>
                            <div className="flex min-h-[4rem] w-[4.75rem] flex-shrink-0 flex-col items-center justify-start self-start rounded-[18px] bg-[#FFF6DF] px-2.5 py-2.5 text-[#B27614]">
                                <span className="w-full truncate text-center text-base font-black leading-none">{featuredResource.downloads_count}</span>
                                <span className="mt-1 text-center text-[9px] font-bold uppercase tracking-[0.08em]">Downloads</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 app-sheet p-4">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search title, tag, or description" />

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterType(tab.key)}
                                className={`app-chip whitespace-nowrap ${filterType === tab.key ? "app-chip-active" : ""}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {SOURCE_FILTER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSourceFilter(tab.key)}
                                className={`app-chip whitespace-nowrap ${sourceFilter === tab.key ? "app-chip-active" : ""}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-[28px]" />)}
                        </div>
                    ) : error ? (
                        <ErrorState
                            message={error}
                            onRetry={onRetry}
                        />
                    ) : filteredResources.length === 0 ? (
                        <EmptyState
                            title="No resources found"
                            description={search ? "Try a different search term or clear the filters." : "There are no resources for this category yet."}
                        />
                    ) : (
                        <div className="space-y-3">
                            {filteredResources.map((resource) => (
                                <div key={resource.id}>
                                    <ResourceCard
                                        resource={resource}
                                        isLocked={resource.is_locked || !canAccessResource(resource.access_level)}
                                        showCourseContext={false}
                                    />
                                    {!!resource.tags?.length && (
                                        <div className="ml-2 mt-2 flex flex-wrap gap-2">
                                            {resource.tags.slice(0, 3).map((tag) => (
                                                <span key={`${resource.id}-${tag}`} className="rounded-full bg-[#EAF4F1] px-3 py-1 text-[11px] font-semibold text-[#4D6691]">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
    return (
        <div className={`app-stat-card rounded-[24px] ${tone}`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</p>
        </div>
    );
}

function isRecent(dateString: string) {
    const createdAt = new Date(dateString).getTime();
    return Date.now() - createdAt < 1000 * 60 * 60 * 24 * 7;
}
