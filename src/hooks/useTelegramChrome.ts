import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";

const APP_THEME = {
    background: "#eef3f0",
    secondaryBackground: "#e2ebe8",
    text: "#172b2f",
    hint: "#667c82",
    link: "#3f6f6a",
    button: "#172b2f",
    buttonText: "#ffffff",
    section: "rgba(250,252,250,0.94)",
    header: "#172b2f",
};

function setTelegramThemeVars() {
    const root = document.documentElement;

    root.style.setProperty("--tg-bg-color", APP_THEME.background);
    root.style.setProperty("--tg-secondary-bg-color", APP_THEME.secondaryBackground);
    root.style.setProperty("--tg-text-color", APP_THEME.text);
    root.style.setProperty("--tg-hint-color", APP_THEME.hint);
    root.style.setProperty("--tg-link-color", APP_THEME.link);
    root.style.setProperty("--tg-button-color", APP_THEME.button);
    root.style.setProperty("--tg-button-text-color", APP_THEME.buttonText);
    root.style.setProperty("--tg-section-bg-color", APP_THEME.section);
    root.style.setProperty("--tg-header-bg-color", APP_THEME.header);
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
            WebApp.setBackgroundColor(APP_THEME.background);
            WebApp.setHeaderColor(APP_THEME.header);
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
