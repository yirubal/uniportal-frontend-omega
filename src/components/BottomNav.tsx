import { Home, Library, Brain, Trophy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/resources", icon: Library, label: "Library" },
    { path: "/quiz", icon: Brain, label: "Practice" },
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
            <div className="app-tabbar mx-auto flex max-w-md items-center justify-between rounded-[30px] px-2 py-3">
                {tabs.map((tab) => {
                    const Icon = tab.icon;

                    return (
                        <button
                            type="button"
                            key={tab.path}
                            aria-current={isActive(tab.path) ? "page" : undefined}
                            data-haptic="selection"
                            onClick={() => navigate(tab.path)}
                            className={`
                nav-tab relative flex min-w-0 flex-1 appearance-none flex-col items-center justify-center
              gap-1.5 rounded-[22px] px-2 py-4 h-14
              ${isActive(tab.path)
                                    ? "bg-card text-ink border border-line-strong shadow-[0_10px_22px_rgba(23,43,47,0.08)]"
                                    : "bg-transparent text-steel"
                                }
            `}
                        >
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${isActive(tab.path)
                                    ? "bg-fill-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                                    : "bg-wash text-steel"
                                    }`}
                            >
                                <Icon size={17} strokeWidth={2.25} />
                            </span>
                            <span
                                className={`text-[11px] leading-none
                ${isActive(tab.path) ? "font-bold text-ink" : "font-medium"}`}
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
