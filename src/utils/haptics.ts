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
