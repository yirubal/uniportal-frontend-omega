import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const TAB_ROOTS = new Set(["/home", "/resources", "/quiz", "/exit-exam"]);

type Direction = "forward" | "back" | "tab" | "fade";

function getDirection(previous: string, next: string, navigationType: string): Direction {
    if (navigationType === "POP") return "back";
    if (TAB_ROOTS.has(previous) && TAB_ROOTS.has(next)) return "tab";
    // Going up the tree (e.g. "Home" from a detail screen) reads as back even though it's a push.
    if (previous.startsWith(`${next}/`) || (TAB_ROOTS.has(next) && !TAB_ROOTS.has(previous))) return "back";
    if (navigationType === "REPLACE") return "fade";
    return "forward";
}

// Where a new screen starts its entrance (see .app-screen in index.css). Set as variables rather than
// switching animation names, so a screen that stays mounted never replays its animation.
const ENTER: Record<Direction, { x: string; scale: string }> = {
    forward: { x: "32px", scale: "1" },
    back: { x: "-32px", scale: "1" },
    tab: { x: "0px", scale: "0.985" },
    fade: { x: "0px", scale: "0.99" },
};

/** Picks the entrance for the next screen from the kind of navigation. */
export function useScreenTransitions() {
    const location = useLocation();
    const navigationType = useNavigationType();
    const previousPathRef = useRef(location.pathname);

    useLayoutEffect(() => {
        const previous = previousPathRef.current;
        previousPathRef.current = location.pathname;
        if (previous === location.pathname) return;

        const enter = ENTER[getDirection(previous, location.pathname, navigationType)];
        const root = document.documentElement.style;
        root.setProperty("--enter-x", enter.x);
        root.setProperty("--enter-scale", enter.scale);
    }, [location.pathname, navigationType]);
}
