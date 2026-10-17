import { ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import WebApp from "@twa-dev/sdk";
import { haptic } from "../utils/haptics";

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
    const onClickRef = useRef(onClick);

    useEffect(() => {
        onClickRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        if (!WebApp.isVersionAtLeast?.("6.1")) {
            return;
        }

        // Telegram's own back button isn't a DOM click, so the shared tap listener doesn't see it.
        const handleBack = () => {
            haptic.light();
            onClickRef.current();
        };

        WebApp.BackButton.show();
        WebApp.BackButton.onClick(handleBack);

        return () => {
            WebApp.BackButton.offClick(handleBack);
            WebApp.BackButton.hide();
        };
    }, []);

    const isSurfaceTone = tone === "dark";
    const buttonStyle = isSurfaceTone
        ? {
            backgroundColor: "color-mix(in srgb, var(--tg-section-bg-color) 94%, white 6%)",
            color: "var(--tg-text-color)",
            borderColor: "color-mix(in srgb, var(--tg-text-color) 10%, transparent)",
            paddingInline: "1.25rem",
            paddingBlock: "0.75rem",
        }
        : {
            backgroundColor: "var(--tg-button-color)",
            color: "var(--tg-button-text-color)",
            borderColor: "color-mix(in srgb, var(--tg-button-color) 78%, white 22%)",
            paddingInline: "1.25rem",
            paddingBlock: "0.75rem",
        };
    const shadowClass = isSurfaceTone
        ? "shadow-[0_10px_24px_rgba(23,43,47,0.08)]"
        : "shadow-[0_10px_24px_rgba(7,14,28,0.2)]";

    return (
        <div className="mb-5 flex items-center justify-between gap-3">
            <button
                type="button"
                onClick={onClick}
                style={buttonStyle}
                className={`inline-flex min-h-[2.75rem] appearance-none items-center gap-2 rounded-[5px] border text-sm font-semibold transition-[transform,background-color,border-color,color] duration-200 active:scale-[0.98] focus:outline-none ${shadowClass}`}
            >
                <ArrowLeft size={16} />
                <span className="leading-none">{label}</span>
            </button>
            {trailing}
        </div>
    );
}
