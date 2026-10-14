import { ArrowRight, FileCheck2, FileClock, TimerReset } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LockedOverlay from "../components/LockedOverlay";
import ResumeAttemptCard from "../components/ResumeAttemptCard";
import TopBackButton from "../components/TopBackButton";
import { useAccess } from "../hooks/useAccess";
import { useStudentProfile } from "../hooks/useStudentProfile";
import {
    EXIT_EXAM_CATEGORIES,
    getExitExamMeta,
    type ExitExamCategory,
} from "../utils/exitExams";

function getExitExamIcon(category: ExitExamCategory) {
    if (category === "past_years") return FileClock;
    if (category === "model") return TimerReset;
    return FileCheck2;
}

export default function ExitExamScreen() {
    const navigate = useNavigate();
    const { canAccessExitExam } = useAccess();
    const profile = useStudentProfile();

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Exit exams</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-ink">
                        Choose a timed exit exam path
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
                        {profile.hasCompleteProfile
                            ? `Timed exams are tailored from your saved ${profile.profileLabel.toLowerCase()} profile.`
                            : "Every exit exam path runs with a timer. Start from past years papers or model papers."}
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                {canAccessExitExam && <ResumeAttemptCard modes={["simulation"]} />}
                {!canAccessExitExam ? (
                    <LockedOverlay
                        feature="Exit Exam"
                        description="Practice with realistic timed exam flows, past years papers, and model exams."
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="app-sheet p-5">
                            <p className="app-section-label">
                                {profile.hasCompleteProfile ? "Saved profile" : "Timed modes"}
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-subtle">
                                {profile.hasCompleteProfile
                                    ? `Showing exit exam paths for your current academic scope: ${profile.profileLabel}.`
                                    : "Past years exit exams and exit exam models both use the timed simulation flow."}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {EXIT_EXAM_CATEGORIES.map((category) => {
                                const meta = getExitExamMeta(category);
                                const Icon = getExitExamIcon(category);

                                return (
                                    <button
                                        type="button"
                                        key={category}
                                        onClick={() => navigate(`/exit-exam/list/${category}`)}
                                        className="app-list-item"
                                    >
                                        <div className="app-icon-chip bg-success-tint text-success-ink">
                                            <Icon size={18} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-ink">
                                                    {meta.label}
                                                </p>
                                                <span className="rounded-full bg-mist px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                                                    Timed
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm leading-relaxed text-subtle">
                                                {meta.description}
                                            </p>
                                        </div>

                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-ink">
                                            <ArrowRight size={16} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
