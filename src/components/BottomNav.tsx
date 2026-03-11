import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
    { path: "/resources", icon: "📁", label: "Resources" },
    { path: "/quiz",      icon: "🧠", label: "Quiz"      },
    { path: "/exit-exam", icon: "🎯", label: "Exit Exam" },
];

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) =>
        location.pathname === path ||
        location.pathname.startsWith(path + "/");

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white
                 border-t border-[#EAEAEA] safe-bottom"
        >
            <div className="flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.path}
                        onClick={() => navigate(tab.path)}
                        className={`
              flex-1 flex flex-col items-center gap-1
              pt-2 pb-3 transition-all duration-150
              ${isActive(tab.path)
                            ? "text-[#0A1628]"
                            : "text-[#BBB]"
                        }
            `}
                    >
                        <span className="text-xl leading-none">{tab.icon}</span>
                        <span
                            className={`text-[10px] leading-none
                ${isActive(tab.path) ? "font-bold" : "font-normal"}`}
                        >
              {tab.label}
            </span>
                        {isActive(tab.path) && (
                            <span className="absolute bottom-0 w-6 h-0.5 bg-[#FFB400] rounded-full" />
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
}