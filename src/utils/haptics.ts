import WebApp from "@twa-dev/sdk";

// HapticFeedback exists since Bot API 6.1. Outside Telegram (or on older clients) every call is a no-op.
const supported = () => Boolean(WebApp.initData) && (WebApp.isVersionAtLeast?.("6.1") ?? false);

function run(action: () => void) {
    if (!supported()) return;
    try {
        action();
    } catch {
        // some desktop clients report support but throw; haptics are never essential
    }
}

/** Short vibrations for taps and outcomes. Safe to call anywhere. */
export const haptic = {
    /** Light tap: secondary buttons, toggles, opening a card. */
    light: () => run(() => WebApp.HapticFeedback.impactOccurred("light")),
    /** Firmer tap: primary buttons, choosing an answer. */
    medium: () => run(() => WebApp.HapticFeedback.impactOccurred("medium")),
    heavy: () => run(() => WebApp.HapticFeedback.impactOccurred("heavy")),
    /** A value changed: tabs, chips, segmented controls, question navigator. */
    selection: () => run(() => WebApp.HapticFeedback.selectionChanged()),
    success: () => run(() => WebApp.HapticFeedback.notificationOccurred("success")),
    warning: () => run(() => WebApp.HapticFeedback.notificationOccurred("warning")),
    error: () => run(() => WebApp.HapticFeedback.notificationOccurred("error")),
};

type TapStyle = "light" | "medium" | "selection" | "none";

/**
 * One delegated listener gives every tappable element a tap buzz, so components don't each call it.
 * Defaults: radios, tabs and toggles → selection; everything else → light. Override per element with
 * data-haptic="medium" | "light" | "selection" | "none".
 */
export function installTapHaptics() {
    document.addEventListener(
        "click",
        (event) => {
            const target = (event.target as Element | null)?.closest?.(
                "button, a[href], [role='button'], [role='radio'], [role='tab'], [role='checkbox'], [role='switch']"
            );
            if (!target || target.matches(":disabled, [aria-disabled='true']")) return;

            const explicit = target.getAttribute("data-haptic") as TapStyle | null;
            const role = target.getAttribute("role");
            const style: TapStyle =
                explicit ??
                (role === "radio" || role === "tab" || role === "checkbox" || role === "switch" || target.hasAttribute("aria-pressed")
                    ? "selection"
                    : "light");
            if (style !== "none") haptic[style]();
        },
        { capture: true, passive: true }
    );
}
