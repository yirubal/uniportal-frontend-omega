import { Home, Library, Brain, Trophy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/resources", icon: Library, label: "Library" },
    { path: "/quiz", icon: Brain, label: "Quiz" },
    { path: "/exit-exam", icon: Trophy, label: "Exams" },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) =>
        location.pathname === path ||
        location.pathname.startsWith(path + "/");

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 safe-bottom"
        >
            <div className="app-panel mx-auto flex max-w-md items-center justify-between rounded-[28px] px-2 py-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;

                    return (
                    <button
                        type="button"
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        className={`
              nav-tab relative flex min-w-0 flex-1 appearance-none flex-col items-center gap-1 rounded-[22px]
              px-2 py-2.5 transition-all duration-200 focus:outline-none
              ${isActive(tab.path)
                            ? "bg-[#18253D] text-white shadow-[0_14px_30px_rgba(24,37,61,0.18)]"
                            : "bg-transparent text-[#7F8CA5]"
                        }
            `}
                    >
                        <Icon size={18} strokeWidth={2.2} />
                        <span
                            className={`text-[10px] leading-none
                ${isActive(tab.path) ? "font-bold" : "font-medium"}`}
                        >
              {tab.label}
            </span>
                    </button>
                    );
                })}
            </div>
        </nav>
    );
}
