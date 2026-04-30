import { useEffect, useMemo, useState } from "react";
import { getMyPerformance, type Performance } from "../api/quiz";
import LockedOverlay from "../components/LockedOverlay";
import TopBackButton from "../components/TopBackButton";
import { ErrorState, Skeleton } from "../components/ui";
import { useAccess } from "../hooks/useAccess";
import { useNavigate } from "react-router-dom";

export default function PerformanceScreen() {
    const navigate = useNavigate();
    const { canAccessPerformance } = useAccess();
    const [performance, setPerformance] = useState<Performance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canAccessPerformance) {
            setLoading(false);
            return;
        }

        getMyPerformance()
            .then(setPerformance)
            .catch(() => setError("Failed to load performance analytics."))
            .finally(() => setLoading(false));
    }, [canAccessPerformance]);

    const scoreTrend = useMemo(() => {
        if (!performance?.score_over_time.length) return 0;
        const scores = performance.score_over_time;
        return scores[scores.length - 1].score - scores[0].score;
    }, [performance]);

    if (!canAccessPerformance) {
        return (
            <div className="app-screen">
                <div className="app-topbar">
                    <div className="relative z-10">
                        <TopBackButton onClick={() => navigate("/home")} label="Home" />
                        <p className="app-section-label">Performance</p>
                        <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">Track your growth over time</h1>
                    </div>
                </div>
                <div className="app-scroll app-scroll-compact">
                    <LockedOverlay
                        feature="Performance"
                        description="See score trends, weak topics, and course-by-course progress once premium is enabled."
                    />
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="app-screen px-5 pt-12">
                <Skeleton className="h-32 rounded-[32px] mb-4" />
                <Skeleton className="h-56 rounded-[32px] mb-4" />
                <Skeleton className="h-56 rounded-[32px]" />
            </div>
        );
    }

    if (error || !performance) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <ErrorState message={error ?? "No performance data found."} onRetry={() => window.location.reload()} />
                </div>
            </div>
        );
    }

    const maxScore = Math.max(...performance.score_over_time.map((item) => item.score), 100);

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Performance</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#172B2F]">Academic pulse</h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#526B70]">
                        Keep the analytics dense, readable, and focused on what to revise next.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact space-y-4">
                <div className="app-grid-2">
                    <KpiCard label="Attempts" value={performance.total_attempts} tone="tone-blue" />
                    <KpiCard label="Average" value={`${performance.average_score}%`} tone="tone-green" />
                    <KpiCard label="Best" value={`${performance.best_score}%`} tone="tone-gold" />
                    <KpiCard label="Trend" value={`${scoreTrend >= 0 ? "+" : ""}${scoreTrend}%`} tone="tone-purple" />
                </div>

                <div className="app-sheet p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="app-section-label">Score over time</p>
                            <p className="mt-2 text-base font-semibold text-[#172B2F]">Recent sessions</p>
                        </div>
                        <span className="rounded-full bg-[#EAF8F1] px-3 py-2 text-xs font-bold text-[#2E9E73]">
                            {performance.score_over_time.length} sessions
                        </span>
                    </div>

                    <div className="mt-6 flex h-44 items-end gap-2">
                        {performance.score_over_time.map((point) => (
                            <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                                <div className="relative w-full overflow-hidden rounded-t-[18px] bg-[#E6ECF7]" style={{ height: `${Math.max(18, (point.score / maxScore) * 150)}px` }}>
                                    <div className="absolute inset-x-0 bottom-0 rounded-t-[18px] bg-[linear-gradient(180deg,#5D8F88_0%,#172B2F_100%)]" style={{ height: `${Math.max(18, (point.score / maxScore) * 150)}px` }} />
                                </div>
                                <span className="text-[10px] font-semibold text-[#70868B]">
                                    {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="app-sheet p-5">
                    <p className="app-section-label">Weak topics</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {performance.weak_topics.map((topic) => (
                            <span key={topic} className="rounded-full bg-[#FFF6DF] px-3 py-2 text-[12px] font-semibold text-[#B27614]">
                                {topic}
                            </span>
                        ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#526B70]">
                        These need attention first. Pair topic-based practice with matching resources to improve recall.
                    </p>
                </div>

                <div className="app-sheet p-5">
                    <p className="app-section-label">Course breakdown</p>
                    <div className="mt-4 space-y-3">
                        {performance.attempts_by_course.map((course) => (
                            <div key={course.course_name} className="app-panel-muted rounded-[24px] p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-[#172B2F]">{course.course_name}</p>
                                        <p className="mt-1 text-xs text-[#70868B]">{course.attempts} attempts</p>
                                    </div>
                                    <span className="text-lg font-black text-[#172B2F]">{course.average}%</span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E1E7F2]">
                                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#5D8F88_0%,#172B2F_100%)]" style={{ width: `${course.average}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: string | number;
    tone: string;
}) {
    return (
        <div className={`app-stat-card rounded-[24px] ${tone}`}>
            <p className="text-2xl font-black">{value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em]">{label}</p>
        </div>
    );
}
