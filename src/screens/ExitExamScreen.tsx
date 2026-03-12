import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAccess } from "../hooks/useAccess";
import { getExitExams } from "../api/quiz";
import { ExamPaper } from "../api/quiz";
import LockedOverlay from "../components/LockedOverlay";
import { Skeleton, EmptyState, ErrorState } from "../components/ui";
import { formatDuration } from "../utils/format";

export default function ExitExamScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const { canAccessExitExam } = useAccess();

    const [exams, setExams] = useState<ExamPaper[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canAccessExitExam || !student?.preferred_department) {
            setLoading(false);
            return;
        }
        getExitExams(student.preferred_department)
            .then(setExams)
            .catch(() => setError("Failed to load exit exams."))
            .finally(() => setLoading(false));
    }, [canAccessExitExam, student?.preferred_department]);

    return (
        <div className="fixed inset-0 flex flex-col bg-[#F5F7FA]">
            {/* Header */}
            <div className="bg-[#0A1628] px-5 pt-12 pb-5">
                <h1 className="text-white text-xl font-bold">Exit Exams</h1>
                <p className="text-[#8899AA] text-sm mt-0.5">
                    Simulate national exit examinations
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pb-28">
                {!canAccessExitExam ? (
                    <LockedOverlay
                        feature="Exit Exam"
                        description="Practice with real exit exam papers. Timed simulation, full question bank."
                    />
                ) : loading ? (
                    <div className="px-5 pt-5 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 rounded-2xl" />
                        ))}
                    </div>
                ) : error ? (
                    <ErrorState
                        message={error}
                        onRetry={() => {
                            setLoading(true);
                            setError(null);
                            getExitExams(student!.preferred_department!)
                                .then(setExams)
                                .catch(() => setError("Failed to load exit exams."))
                                .finally(() => setLoading(false));
                        }}
                    />
                ) : exams.length === 0 ? (
                    <EmptyState
                        icon="🎯"
                        title="No exit exams yet"
                        description="Exit exam papers will appear here once they're available for your department."
                    />
                ) : (
                    <div className="px-5 pt-5 flex flex-col gap-3">
                        {exams.map((exam) => (
                            <button
                                key={exam.id}
                                onClick={() => navigate(`/simulate/${exam.id}`)}
                                className="bg-white rounded-2xl p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform text-left w-full"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        {/* Badge row */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 rounded-full">
                                                EXIT EXAM
                                            </span>
                                            <span className="text-[10px] text-[#999]">
                                                {exam.year}
                                            </span>
                                        </div>
                                        <p className="text-[#0A1628] text-sm font-bold leading-snug">
                                            {exam.title}
                                        </p>
                                        {/* Stats row */}
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="flex items-center gap-1 text-[#999] text-xs">
                                                <span>❓</span>
                                                {exam.total_questions} questions
                                            </span>
                                            <span className="flex items-center gap-1 text-[#999] text-xs">
                                                <span>⏱️</span>
                                                {formatDuration(exam.duration_minutes)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="w-9 h-9 rounded-xl bg-[#0A1628] flex items-center justify-center flex-shrink-0">
                                        <span className="text-[#FFB400] text-base font-bold">›</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
