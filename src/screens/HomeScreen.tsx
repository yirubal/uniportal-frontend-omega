import { ArrowRight, BookOpenText, Brain, ChartColumn, FolderOpen, Sparkles, Target } from "lucide-react";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAccess } from "../hooks/useAccess";
import { formatDaysRemaining } from "../utils/format";
import { getPeriodLabel, getProgramLabel } from "../utils/periods";

const QUICK_ACTIONS = [
    {
        path: "/resources",
        icon: FolderOpen,
        label: "Resource Library",
        desc: "Browse notes, worksheets, and exam papers by course.",
        meta: "Study materials",
        tint: "bg-[#EEF3FF] text-[#2D5BFF]",
    },
    {
        path: "/quiz",
        icon: Brain,
        label: "Practice Hub",
        desc: "Choose quick quizzes or past exam papers from your current courses.",
        meta: "Quiz + past exam",
        tint: "bg-[#FFF6DF] text-[#B27614]",
    },
    {
        path: "/exit-exam",
        icon: Target,
        label: "Exit Exams",
        desc: "Choose timed exit exams, past years papers, or model exam practice.",
        meta: "Timed mode",
        tint: "bg-[#EAF8F1] text-[#2E9E73]",
    },
    {
        path: "/performance",
        icon: ChartColumn,
        label: "Performance",
        desc: "Review weak topics, progress, and score trends.",
        meta: "Premium insights",
        tint: "bg-[#F1EDFF] text-[#7654D6]",
    },
];

export default function HomeScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const { isPremium, daysRemaining } = useAccess();
    const greeting = "Selam";
    const profileBadges = [
        getProgramLabel(student?.preferred_program),
        `Year ${student?.preferred_year ?? "?"}`,
        getPeriodLabel(student?.preferred_period, student?.preferred_program),
    ];

    return (
        <div className="app-screen">
            <div className="app-topbar">
                <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7F8CA5]">
                            {greeting}
                        </p>
                        <h1 className="app-title mt-1 text-[1.55rem] font-bold text-[#18253D]">
                            {student?.first_name ?? student?.name ?? "Student"}
                        </h1>
                        <p className="mt-1 text-sm text-[#53627D]">
                            Unity University student portal
                        </p>
                    </div>

                    <div className={`rounded-full px-3 py-2 text-xs font-bold ${isPremium ? "tone-green" : "tone-gold"}`}>
                        {isPremium ? "Premium" : "Free"}
                    </div>
                </div>
            </div>

            <div className="app-scroll app-scroll-compact">
                <div className="app-sheet p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="app-section-label">Current profile</p>
                            <p className="mt-1 text-sm text-[#53627D]">
                                Department-based content and exam prep
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {profileBadges.map((badge) => (
                                    <span
                                        key={badge}
                                        className="inline-flex items-center justify-center rounded-full bg-[#F4F7FD] px-3 py-2 text-xs font-semibold text-[#18253D]"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="shrink-0 rounded-full bg-[#F4F7FD] px-3 py-2 text-xs font-semibold text-[#53627D]">
                            {isPremium ? formatDaysRemaining(daysRemaining) : "Upgrade available"}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        {!isPremium && (
                            <button
                                onClick={() => navigate("/subscribe")}
                                className="inline-flex items-center gap-2 rounded-full bg-[#18253D] px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                <Sparkles size={14} />
                                Unlock premium tools
                            </button>
                        )}
                        <Button
                            variant="ghost"
                            size="md"
                            onClick={() => navigate("/onboarding")}
                            className="rounded-full"
                        >
                            <BookOpenText size={16} />
                            Update setup
                        </Button>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="mb-3 px-1">
                        <p className="app-section-label">Quick access</p>
                        <h2 className="mt-2 text-lg font-bold text-[#18253D]">
                            Continue where you need to work
                        </h2>
                    </div>

                    <div className="space-y-3">
                        {QUICK_ACTIONS.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    key={action.path}
                                    onClick={() => navigate(action.path)}
                                    className="app-list-item"
                                >
                                    <div className={`app-icon-chip ${action.tint}`}>
                                        <Icon size={20} strokeWidth={2.2} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-[#18253D]">
                                                {action.label}
                                            </p>
                                            <span className="inline-flex items-center justify-center rounded-full bg-[#F4F7FD] px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#7F8CA5]">
                                                {action.meta}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm leading-relaxed text-[#53627D]">
                                            {action.desc}
                                        </p>
                                    </div>

                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4F7FD] text-[#18253D]">
                                        <ArrowRight size={16} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5 app-sheet p-4">
                    <p className="app-section-label">This week</p>
                    <div className="mt-3 grid gap-3">
                        <div className="rounded-[20px] bg-[#F6F8FD] px-4 py-3">
                            <p className="text-sm font-semibold text-[#18253D]">
                                Keep resource browsing course-first
                            </p>
                            <p className="mt-1 text-sm text-[#53627D]">
                                Library and quizzes work best after department, program, year, and period are selected.
                            </p>
                        </div>
                        <div className="rounded-[20px] bg-[#F6F8FD] px-4 py-3">
                            <p className="text-sm font-semibold text-[#18253D]">
                                Use practice for speed, simulations for pressure
                            </p>
                            <p className="mt-1 text-sm text-[#53627D]">
                                The app now supports real backend-driven quiz summaries and exit exam flows.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
