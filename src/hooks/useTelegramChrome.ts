import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";

function setTelegramThemeVars() {
    const root = document.documentElement;
    const theme = WebApp.themeParams;

    root.style.setProperty("--tg-bg-color", theme.bg_color || "#f4f6fb");
    root.style.setProperty("--tg-secondary-bg-color", theme.secondary_bg_color || "#eef2f8");
    root.style.setProperty("--tg-text-color", theme.text_color || "#18253d");
    root.style.setProperty("--tg-hint-color", theme.hint_color || "#7f8ca5");
    root.style.setProperty("--tg-link-color", theme.link_color || "#2d5bff");
    root.style.setProperty("--tg-button-color", theme.button_color || "#18253d");
    root.style.setProperty("--tg-button-text-color", theme.button_text_color || "#ffffff");
    root.style.setProperty("--tg-section-bg-color", theme.section_bg_color || "rgba(255,255,255,0.92)");
    root.style.setProperty("--tg-header-bg-color", theme.header_bg_color || "#18253d");
}

function setTelegramViewportVars() {
    const root = document.documentElement;
    const viewportHeight = WebApp.viewportHeight || window.innerHeight;
    const stableHeight = WebApp.viewportStableHeight || viewportHeight;

    root.style.setProperty("--tg-viewport-height", `${viewportHeight}px`);
    root.style.setProperty("--tg-viewport-stable-height", `${stableHeight}px`);
}

export function useTelegramChrome() {
    useEffect(() => {
        const supportsModernChrome = WebApp.isVersionAtLeast?.("6.1") ?? false;

        document.documentElement.classList.add("tg-miniapp");
        setTelegramThemeVars();
        setTelegramViewportVars();

        const handleThemeChange = () => setTelegramThemeVars();
        const handleViewportChange = () => setTelegramViewportVars();

        if (supportsModernChrome) {
            WebApp.setBackgroundColor(
                WebApp.themeParams.bg_color || "#F4F6FB"
            );
            WebApp.setHeaderColor(
                WebApp.themeParams.header_bg_color || "#18253D"
            );
        }

        WebApp.onEvent("themeChanged", handleThemeChange);
        WebApp.onEvent("viewportChanged", handleViewportChange);

        return () => {
            document.documentElement.classList.remove("tg-miniapp");
            WebApp.offEvent("themeChanged", handleThemeChange);
            WebApp.offEvent("viewportChanged", handleViewportChange);
        };
    }, []);
}
