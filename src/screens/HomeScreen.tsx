import { ArrowRight, Brain, ChartColumn, FolderOpen, Sparkles, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAccess } from "../hooks/useAccess";
import { formatDaysRemaining } from "../utils/format";

const QUICK_ACTIONS = [
    {
        path: "/resources",
        icon: FolderOpen,
        label: "Resource library",
        desc: "Notes, worksheets, and past papers by course.",
        tone: "tone-blue",
    },
    {
        path: "/quiz",
        icon: Brain,
        label: "Practice sessions",
        desc: "Short drills for management, marketing, accounting, and more.",
        tone: "tone-gold",
    },
    {
        path: "/exit-exam",
        icon: Target,
        label: "Exit exam prep",
        desc: "Timed simulations with exam-like pacing.",
        tone: "tone-green",
    },
    {
        path: "/performance",
        icon: ChartColumn,
        label: "Performance",
        desc: "Track weak topics and progress over time.",
        tone: "tone-purple",
    },
];

export default function HomeScreen() {
    const navigate = useNavigate();
    const { student } = useAuthStore();
    const { isPremium, daysRemaining } = useAccess();

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 18) return "Good afternoon";
        return "Good evening";
    })();

    return (
        <div className="app-screen">
            <div className="app-hero">
                <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/70">{greeting}</p>
                        <h1 className="app-title mt-1 text-[2rem] font-bold text-white">
                            {student?.first_name ?? "Student"}
                        </h1>
                        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/72">
                            A focused study space for business and social science courses, with room for computing and other departments as the catalog grows.
                        </p>
                    </div>

                    <div className="shrink-0 rounded-full border border-white/14 bg-white/10 px-3 py-2 text-right backdrop-blur">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                            Access
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                            {isPremium ? "Premium" : "Free"}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 mt-6 app-panel rounded-[28px] p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="app-section-label">Study profile</p>
                            <p className="mt-2 text-base font-semibold text-[#18253D]">
                                Year {student?.preferred_year ?? "?"} · Semester {student?.preferred_semester ?? "?"}
                            </p>
                            <p className="mt-1 text-sm text-[#53627D]">
                                Use quick practice now and scale into deeper revision as more courses go live.
                            </p>
                        </div>

                        <div className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${isPremium ? "tone-green" : "tone-gold"}`}>
                            {isPremium ? formatDaysRemaining(daysRemaining) : "Upgrade for full access"}
                        </div>
                    </div>
                </div>
            </div>

            <div className="app-scroll">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <p className="app-section-label">Overview</p>
                        <h2 className="app-title mt-2 text-[1.4rem] font-bold text-[#18253D]">
                            Choose where to focus today
                        </h2>
                    </div>
                    {!isPremium && (
                        <button
                            onClick={() => navigate("/subscribe")}
                            className="app-chip app-chip-active"
                        >
                            <Sparkles size={14} />
                            Go premium
                        </button>
                    )}
                </div>

                <div className="app-grid-2">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;

                        return (
                            <button
                                key={action.path}
                                onClick={() => navigate(action.path)}
                                className="app-panel flex min-h-[178px] flex-col items-start justify-between rounded-[28px] p-4 text-left transition-transform duration-200 active:scale-[0.985]"
                            >
                                <div className={`app-stat-card ${action.tone} flex h-12 w-12 items-center justify-center rounded-[18px]`}>
                                    <Icon size={22} strokeWidth={2.2} />
                                </div>
                                <div className="mt-6">
                                    <p className="text-base font-semibold text-[#18253D]">
                                        {action.label}
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed text-[#53627D]">
                                        {action.desc}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#2D5BFF]">
                                    Open
                                    <ArrowRight size={16} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 app-panel rounded-[32px] p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="app-section-label">Curriculum direction</p>
                            <h3 className="app-title mt-2 text-[1.3rem] font-bold text-[#18253D]">
                                Built for social studies first
                            </h3>
                        </div>
                        <div className="rounded-full bg-[#EDF2FF] p-3 text-[#2D5BFF]">
                            <Sparkles size={18} />
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                        {[
                            "Management and marketing flows should feel structured, calm, and readable under pressure.",
                            "Accounting and quantitative topics need clean hierarchy so figures and option sets are easy to scan.",
                            "The layout leaves enough flexibility to absorb computer science and other departments later.",
                        ].map((point) => (
                            <div key={point} className="app-panel-muted rounded-[22px] px-4 py-3 text-sm leading-relaxed text-[#53627D]">
                                {point}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
