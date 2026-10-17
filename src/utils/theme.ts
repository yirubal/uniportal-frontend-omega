import WebApp from "@twa-dev/sdk";
import { useSyncExternalStore } from "react";

/** "system" follows Telegram's light/dark setting (or the browser's, outside Telegram). */
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "uniportal-theme";

// Colours for Telegram's own header, background and bottom bars, matching --tg-header-bg-color and --tg-bg-color.
const CHROME = {
    light: { header: "#172b2f", background: "#eef3f0", bottomBar: "#eef3f0" },
    dark: { header: "#0b1416", background: "#0f1a1c", bottomBar: "#0f1a1c" },
} as const;

const listeners = new Set<() => void>();
let preference: ThemePreference = readPreference();
let resolved: ResolvedTheme = resolve(preference);

function readPreference(): ThemePreference {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {
        // storage blocked: fall back to following the system
    }
    return "system";
}

function insideTelegram() {
    return Boolean(WebApp.initData);
}

function systemTheme(): ResolvedTheme {
    if (insideTelegram()) return WebApp.colorScheme === "dark" ? "dark" : "light";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(pref: ThemePreference): ResolvedTheme {
    return pref === "system" ? systemTheme() : pref;
}

function paintChrome(theme: ResolvedTheme) {
    const colors = CHROME[theme];
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colors.background);
    if (!insideTelegram()) return;
    // Each call is gated on the Bot API version that introduced it.
    if (WebApp.isVersionAtLeast?.("6.1")) {
        WebApp.setHeaderColor(colors.header);
        WebApp.setBackgroundColor(colors.background);
    }
    if (WebApp.isVersionAtLeast?.("7.10")) {
        WebApp.setBottomBarColor(colors.bottomBar);
    }
}

function apply() {
    resolved = resolve(preference);
    document.documentElement.dataset.theme = resolved;
    paintChrome(resolved);
    listeners.forEach((listener) => listener());
}

/** Applies the theme before the first render (no light flash) and follows system changes. Call once. */
export function initTheme() {
    apply();
    WebApp.onEvent("themeChanged", () => {
        if (preference === "system") apply();
    });
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
        if (preference === "system" && !insideTelegram()) apply();
    });
}

export function setThemePreference(next: ThemePreference) {
    preference = next;
    try {
        localStorage.setItem(STORAGE_KEY, next);
    } catch {
        // not remembered, but still applied for this session
    }
    apply();
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** Current preference and the theme it resolves to; re-renders when either changes. */
export function useTheme() {
    const currentPreference = useSyncExternalStore(subscribe, () => preference);
    const currentTheme = useSyncExternalStore(subscribe, () => resolved);
    return { preference: currentPreference, theme: currentTheme, setPreference: setThemePreference };
}
