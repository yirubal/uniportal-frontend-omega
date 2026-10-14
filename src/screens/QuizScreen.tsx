import { ArrowRight, BookOpenCheck, FileText, Target } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useNavigate } from "react-router-dom";
import TopBackButton from "../components/TopBackButton";
import { useQuizStore, type PracticeContentType } from "../store/quizStore";
import { getPracticeContentMeta } from "../utils/practice";
import ResumeAttemptCard from "../components/ResumeAttemptCard";

const PRACTICE_OPTIONS: PracticeContentType[] = ["quiz", "past_exam"];

export default function QuizScreen() {
    const navigate = useNavigate();
    const { resetAttempt, setPracticeContentType } = useQuizStore(
        useShallow((state) => ({
            resetAttempt: state.resetAttempt,
            setPracticeContentType: state.setPracticeContentType,
        }))
    );

    const handleOpenPath = (type: PracticeContentType) => {
        setPracticeContentType(type);
        resetAttempt();
        navigate("/quiz/setup");
    };

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10">
                    <TopBackButton onClick={() => navigate("/home")} label="Home" />
                    <p className="app-section-label">Practice hub</p>
                    <h1 className="app-title mt-2 text-[1.65rem] font-bold text-ink">
                        Choose how you want to practice
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-subtle">
                        Start with quick quizzes or open a past exam paper from your course.
                    </p>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact space-y-4">
                <ResumeAttemptCard modes={["practice", "selective"]} />
                <div className="app-sheet p-5">
                    <p className="app-section-label">What changed</p>
                    <p className="mt-3 text-sm leading-relaxed text-subtle">
                        Practice is no longer only short quiz sets. Past exam papers can include true or false,
                        fill-in, matching, essay, and choice questions.
                    </p>
                </div>

                <div className="space-y-3">
                    {PRACTICE_OPTIONS.map((type) => {
                        const meta = getPracticeContentMeta(type);
                        const Icon = type === "quiz" ? BookOpenCheck : FileText;

                        return (
                            <button
                                type="button"
                                key={type}
                                onClick={() => handleOpenPath(type)}
                                className="app-list-item"
                            >
                                <div className={`app-icon-chip ${type === "quiz" ? "bg-accent-soft text-accent" : "bg-gold-tint text-gold-ink"}`}>
                                    <Icon size={18} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-ink">
                                            {meta.navLabel}
                                        </p>
                                        <span className="rounded-full bg-mist px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                                            Practice
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm leading-relaxed text-subtle">
                                        {meta.hubDescription}
                                    </p>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-ink">
                                    <ArrowRight size={16} />
                                </div>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => {
                            resetAttempt();
                            navigate("/quiz/selective");
                        }}
                        className="app-list-item"
                    >
                        <div className="app-icon-chip bg-accent-soft text-accent">
                            <Target size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-ink">
                                    Selective Practice
                                </p>
                                <span className="rounded-full bg-mist px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                                    Topics
                                </span>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-subtle">
                                Choose specific chapters or topics and practice only those questions.
                            </p>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-ink">
                            <ArrowRight size={16} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
