import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../utils/motion";

/** Counts from 0 up to `target` with an ease-out curve. Shows the final value straight away under reduced motion. */
export function useCountUp(target: number, durationMs = 900, delayMs = 150) {
    const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));

    useEffect(() => {
        if (prefersReducedMotion()) return;
        let frame = 0;
        let start: number | null = null;
        const tick = (now: number) => {
            start ??= now + delayMs;
            const progress = Math.min(1, Math.max(0, (now - start) / durationMs));
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, durationMs, delayMs]);

    return value;
}
