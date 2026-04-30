import { Home, Library, Brain, Trophy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import WebApp from "@twa-dev/sdk";

const tabs = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/resources", icon: Library, label: "Library" },
    { path: "/quiz", icon: Brain, label: "Practice" },
    { path: "/exit-exam", icon: Trophy, label: "Exams" },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const supportsHaptics = WebApp.isVersionAtLeast?.("6.1") ?? false;

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
                            onClick={() => {
                                if (supportsHaptics) {
                                    WebApp.HapticFeedback.selectionChanged();
                                }
                                navigate(tab.path);
                            }}
                            className={`
                nav-tab relative flex min-w-0 flex-1 appearance-none flex-col items-center justify-center
              gap-1.5 rounded-[22px] px-2 py-4 h-14
              ${isActive(tab.path)
                                    ? "bg-[rgba(255,255,255,0.96)] text-[#18253D] border border-[rgba(31,53,91,0.1)] shadow-[0_10px_22px_rgba(20,38,67,0.08)]"
                                    : "bg-transparent text-[#6F7D96]"
                                }
            `}
                        >
                            <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-200 ${isActive(tab.path)
                                    ? "bg-[#183B9A] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                                    : "bg-[rgba(233,239,247,0.88)] text-[#60728F]"
                                    }`}
                            >
                                <Icon size={17} strokeWidth={2.25} />
                            </span>
                            <span
                                className={`text-[10px] leading-none
                ${isActive(tab.path) ? "font-bold text-[#18253D]" : "font-medium"}`}
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
