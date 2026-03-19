import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface TopBackButtonProps {
    onClick: () => void;
    label?: string;
    tone?: "light" | "dark";
    trailing?: ReactNode;
}

export default function TopBackButton({
    onClick,
    label = "Back",
    tone = "light",
    trailing,
}: TopBackButtonProps) {
    const styles = tone === "dark"
        ? "bg-[rgba(255,255,255,0.9)] text-[#18253D] border border-[rgba(31,53,91,0.08)]"
        : "bg-white/10 text-white border border-white/12 backdrop-blur";

    return (
        <div className="mb-5 flex items-center justify-between gap-3">
            <button
                type="button"
                onClick={onClick}
                className={`inline-flex appearance-none items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none ${styles}`}
            >
                <ArrowLeft size={16} />
                <span>{label}</span>
            </button>
            {trailing}
        </div>
    );
}
