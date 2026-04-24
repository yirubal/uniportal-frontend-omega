import { FileCheck2, TimerReset } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExitExamTopics, getExitExams, type ExamPaper } from "../api/quiz";
import LockedOverlay from "../components/LockedOverlay";
import TopBackButton from "../components/TopBackButton";
import { EmptyState, ErrorState, Skeleton } from "../components/ui";
import { useAccess } from "../hooks/useAccess";
import { useAuthStore } from "../store/authStore";
import { formatDuration } from "../utils/format";

export default function ExitExamScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const { canAccessExitExam } = useAccess();

    const [exams, setExams] = useState<ExamPaper[]>([]);
    const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canAccessExitExam || !student?.preferred_department) {
            setLoading(false);
            return;
        }

        Promise.all([
            getExitExams(student.preferred_department),
            getExitExamTopics(student.preferred_department),
        ])
            .then(([examItems, topicItems]) => {
                setExams(examItems);
                setTopics(topicItems);
            })
            .catch(() => setError("Failed to load exit exam content."))
            .finally(() => setLoading(false));
    }, [canAccessExitExam, student?.preferred_department]);

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Exit exams</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-[#18253D]">Timed exam practice</h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#53627D]">
                        Pick a paper, check the topic mix, and start a realistic timed simulation.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                {!canAccessExitExam ? (
                    <LockedOverlay
                        feature="Exit Exam"
                        description="Practice with realistic timed exam flows and full topic coverage."
                    />
                ) : loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32 rounded-[32px]" />
                        <Skeleton className="h-28 rounded-[32px]" />
                        <Skeleton className="h-28 rounded-[32px]" />
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={() => window.location.reload()} />
                ) : (
                    <div className="space-y-4">
                        {topics.length > 0 && (
                            <div className="app-sheet p-5">
                                <p className="app-section-label">Topic clusters</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {topics.map((topic) => (
                                        <span key={topic.topic} className="rounded-full bg-[#EEF3FF] px-3 py-2 text-[12px] font-semibold text-[#4D6691]">
                                            {topic.topic} · {topic.count}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {exams.length === 0 ? (
                            <EmptyState
                                title="No exit exams yet"
                                description="Exit exam papers will appear here once they are available for your department."
                            />
                        ) : (
                            exams.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => navigate(`/simulate/${exam.id}`)}
                                    className="app-list-item"
                                >
                                    <div className="app-icon-chip bg-[#EAF8F1] text-[#2E9E73]">
                                        <FileCheck2 size={18} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-[#EAF8F1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2E9E73]">
                                                Exit exam
                                            </span>
                                            <span className="rounded-full bg-[#FFF6DF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B27614]">
                                                {exam.year}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold leading-snug text-[#18253D]">{exam.title}</p>
                                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-[#7F8CA5]">
                                            <span>{exam.total_questions} questions</span>
                                            <span>{formatDuration(exam.duration_minutes)}</span>
                                            <span>Timed simulation</span>
                                        </div>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F7FD] text-[#18253D]">
                                        <TimerReset size={18} />
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
