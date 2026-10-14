import { useEffect, useState } from "react";
import { formatTimeRemaining, getSecondsUntil } from "../utils/format";

const LOW_TIME_SECONDS = 300;
const CRITICAL_TIME_SECONDS = 60;

/**
 * Seconds left until `deadline`, refreshed every second and when the app becomes visible again.
 * Lives in the timer components only, so the exam screen itself doesn't re-render every second.
 */
function useSecondsLeft(deadline: number) {
    const [secondsLeft, setSecondsLeft] = useState(() => getSecondsUntil(deadline));

    useEffect(() => {
        const update = () => setSecondsLeft(getSecondsUntil(deadline));
        const timer = window.setInterval(update, 1000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") update();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [deadline]);

    return secondsLeft;
}

export function ExamTimerChip({ deadline }: { deadline: number }) {
    const secondsLeft = useSecondsLeft(deadline);
    const isLowTime = secondsLeft > 0 && secondsLeft <= LOW_TIME_SECONDS;
    const isCriticalTime = secondsLeft > 0 && secondsLeft <= CRITICAL_TIME_SECONDS;

    // Screen readers aren't told every second; this text changes only at the 5- and 1-minute marks.
    const milestone = isCriticalTime ? "1 minute left" : isLowTime ? "5 minutes left" : "";

    return (
        <>
            <span className="sr-only" aria-live="assertive">{milestone}</span>
            <span
                role="timer"
                aria-label={`${formatTimeRemaining(secondsLeft)} left`}
                className={`rounded-full px-3 py-2 text-xs font-bold tabular-nums transition-all ${isLowTime ? "bg-coral-soft text-danger" : "bg-ink text-white"} ${isCriticalTime ? "animate-pulse shadow-[0_0_0_6px_rgba(217,90,80,0.12)]" : ""}`}
            >
                {formatTimeRemaining(secondsLeft)}
            </span>
        </>
    );
}

export function ExamTimerBar({ deadline, totalSeconds }: { deadline: number; totalSeconds: number }) {
    const secondsLeft = useSecondsLeft(deadline);
    const isLowTime = secondsLeft > 0 && secondsLeft <= LOW_TIME_SECONDS;
    const isCriticalTime = secondsLeft > 0 && secondsLeft <= CRITICAL_TIME_SECONDS;
    const progress = totalSeconds > 0 ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100)) : 0;

    return (
        <div className="mt-3 app-sheet p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="app-section-label">Timer</p>
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${isLowTime ? "text-danger" : "text-steel"}`}>
                    {progress.toFixed(0)}% left
                </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[rgba(23,43,47,0.08)]">
                <div
                    className={`h-full rounded-full transition-[width,background-color] duration-1000 ease-linear ${isLowTime ? "bg-danger" : "bg-ink"} ${isCriticalTime ? "animate-pulse" : ""}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
