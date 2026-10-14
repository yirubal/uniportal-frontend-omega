import { FileCheck2, TimerReset } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExitExams, getExitExamTopics, type ExamPaper } from "../api/quiz";
import LockedOverlay from "../components/LockedOverlay";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useAccess } from "../hooks/useAccess";
import { useAsyncData } from "../hooks/useAsyncData";
import { useStudentProfile } from "../hooks/useStudentProfile";
import { useAuthStore } from "../store/authStore";
import { useQuizStore } from "../store/quizStore";
import { formatDuration } from "../utils/format";
import {
    getExitExamCategory,
    getExitExamMeta,
    isExitExamCategory,
} from "../utils/exitExams";

const NO_EXAMS: ExamPaper[] = [];

export default function ExitExamListScreen() {
    const navigate = useNavigate();
    const { category } = useParams();
    const student = useAuthStore((state) => state.student);
    const { canAccessExitExam } = useAccess();
    const profile = useStudentProfile();
    const resetAttempt = useQuizStore((state) => state.resetAttempt);

    const exitCategory = isExitExamCategory(category) ? category : null;
    const meta = exitCategory ? getExitExamMeta(exitCategory) : null;
    const departmentId = student?.preferred_department ?? null;

    const content = useAsyncData(
        exitCategory && canAccessExitExam && departmentId ? String(departmentId) : null,
        async (signal) => {
            const options = { signal };
            const [exams, topics] = await Promise.all([
                getExitExams(departmentId!, options),
                getExitExamTopics(departmentId!, options),
            ]);
            return { exams, topics };
        }
    );
    const exams = content.data?.exams ?? NO_EXAMS;
    const topics = content.data?.topics ?? [];
    const loading = content.loading;
    const error = content.error ? "Failed to load exit exam content." : null;

    const filteredExams = useMemo(() => {
        if (!exitCategory) return [];
        return exams.filter((exam) => getExitExamCategory(exam) === exitCategory);
    }, [exams, exitCategory]);

    if (!exitCategory || !meta) {
        return (
            <div className="app-screen">
                <div className="app-scroll pt-12">
                    <EmptyState
                        title="Choose an exit exam path first"
                        description="Open the exit exam page and choose the exam type you want to practice."
                        action={{ label: "Back to exit exams", onClick: () => navigate("/exit-exam", { replace: true }) }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/exit-exam")} label="Exams" />
                    <p className="app-section-label">Exit exams</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-ink">
                        {meta.title}
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
                        {profile.hasCompleteProfile
                            ? `${meta.description} Showing papers from your saved ${profile.profileLabel.toLowerCase()} profile.`
                            : meta.description}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                {!canAccessExitExam ? (
                    <LockedOverlay
                        feature="Exit Exam"
                        description="Practice with realistic timed exam flows, past years papers, and model exams."
                    />
                ) : loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32 rounded-[32px]" />
                        <Skeleton className="h-28 rounded-[32px]" />
                        <Skeleton className="h-28 rounded-[32px]" />
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={content.reload} />
                ) : (
                    <div className="space-y-4">
                        {topics.length > 0 && (
                            <div className="app-sheet p-5">
                                <p className="app-section-label">Topic clusters</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {topics.map((topic) => (
                                        <span key={topic.topic} className="rounded-full bg-accent-soft px-3 py-2 text-[12px] font-semibold text-[#4D6691]">
                                            {topic.topic} · {topic.count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredExams.length === 0 ? (
                            <EmptyState
                                title={meta.emptyTitle}
                                description={meta.emptyDescription}
                            />
                        ) : (
                            filteredExams.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => {
                                        resetAttempt();
                                        navigate(`/simulate/${exam.id}`, { state: { exam } });
                                    }}
                                    className="app-list-item"
                                >
                                    <div className="app-icon-chip bg-success-tint text-success-ink">
                                        <FileCheck2 size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-success-tint px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-success-ink">
                                                {meta.badgeLabel}
                                            </span>
                                            <span className="rounded-full bg-gold-tint px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-ink">
                                                {exam.year}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold leading-snug text-ink">{exam.title}</p>
                                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-faint">
                                            <span>{exam.total_questions} questions</span>
                                            <span>{formatDuration(exam.duration_minutes)}</span>
                                            <span>Timed simulation</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className="rounded-full bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                                            Rules
                                        </span>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mist text-ink">
                                            <TimerReset size={18} />
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
