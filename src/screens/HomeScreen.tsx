import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useAccess } from "../hooks/useAccess";
import { formatDaysRemaining } from "../utils/format";

const QUICK_ACTIONS = [
    {
        path: "/resources",
        icon: "📁",
        label: "Resources",
        desc: "Lecture notes & past exams",
        color: "#E8F4FD",
        textColor: "#1565C0",
    },
    {
        path: "/quiz",
        icon: "🧠",
        label: "Practice Quiz",
        desc: "Test your knowledge",
        color: "#FFF3E0",
        textColor: "#E65100",
    },
    {
        path: "/exit-exam",
        icon: "🎯",
        label: "Exit Exam",
        desc: "Simulate final exit exams",
        color: "#E8F5E9",
        textColor: "#1B5E20",
    },
    {
        path: "/performance",
        icon: "📊",
        label: "Performance",
        desc: "Track your progress",
        color: "#F3E5F5",
        textColor: "#6A1B9A",
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
        <div className="fixed inset-0 flex flex-col bg-[#F5F7FA] overflow-y-auto">
            {/* Hero header */}
            <div
                className="px-5 pt-12 pb-8"
                style={{
                    background: "linear-gradient(160deg, #0A1628 0%, #1A3A5C 100%)",
                }}
            >
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[#8899AA] text-sm">{greeting} 👋</p>
                        <h1 className="text-white text-2xl font-bold mt-0.5">
                            {student?.first_name ?? "Student"}
                        </h1>
                    </div>

                    {/* Premium badge */}
                    {isPremium ? (
                        <div className="flex flex-col items-end">
                            <span className="bg-[#FFB400] text-[#0A1628] text-[10px] font-black px-2.5 py-1 rounded-full">
                                ⭐ PREMIUM
                            </span>
                            <span className="text-[#8899AA] text-[10px] mt-1">
                                {formatDaysRemaining(daysRemaining)}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate("/subscribe")}
                            className="bg-[#FFB400]/15 border border-[#FFB400]/40 text-[#FFB400] text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                        >
                            Upgrade ↗
                        </button>
                    )}
                </div>

                {/* Sub-info */}
                {student?.preferred_department && (
                    <div className="flex items-center gap-2 mt-4">
                        <span className="text-[#8899AA] text-xs">🎓</span>
                        <span className="text-[#8899AA] text-xs">
                            Year {student.preferred_year} · Semester {student.preferred_semester}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 px-5 pt-5 pb-28">
                <p className="text-[#999] text-xs font-semibold uppercase tracking-widest mb-3">
                    Quick Actions
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action.path}
                            onClick={() => navigate(action.path)}
                            className="flex flex-col items-start p-4 bg-white rounded-2xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] active:scale-[0.97] transition-transform duration-150 text-left"
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3"
                                style={{ backgroundColor: action.color }}
                            >
                                {action.icon}
                            </div>
                            <p className="text-[#0A1628] text-sm font-bold leading-tight">
                                {action.label}
                            </p>
                            <p className="text-[#999] text-[11px] mt-0.5 leading-snug">
                                {action.desc}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Premium upsell strip (free users only) */}
                {!isPremium && (
                    <button
                        onClick={() => navigate("/subscribe")}
                        className="mt-5 w-full flex items-center gap-4 bg-[#0A1628] rounded-2xl p-4 active:scale-[0.98] transition-transform"
                    >
                        <span className="text-3xl">⭐</span>
                        <div className="flex-1 text-left">
                            <p className="text-[#FFB400] text-sm font-bold">Go Premium</p>
                            <p className="text-[#8899AA] text-xs mt-0.5">
                                Unlock exit exams, unlimited downloads & more
                            </p>
                        </div>
                        <span className="text-[#FFB400] text-lg">›</span>
                    </button>
                )}
            </div>
        </div>
    );
}
