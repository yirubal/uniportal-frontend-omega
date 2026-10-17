import { useEffect } from "react";
import WebApp from "@twa-dev/sdk";

// Colours (CSS variables and Telegram's header/background bars) are handled by utils/theme.ts.

function setTelegramViewportVars() {
    const root = document.documentElement;
    const viewportHeight = WebApp.viewportHeight || window.innerHeight;
    const stableHeight = WebApp.viewportStableHeight || viewportHeight;

    root.style.setProperty("--tg-viewport-height", `${viewportHeight}px`);
    root.style.setProperty("--tg-viewport-stable-height", `${stableHeight}px`);
}

export function useTelegramChrome() {
    useEffect(() => {
        document.documentElement.classList.add("tg-miniapp");
        setTelegramViewportVars();

        const handleViewportChange = () => setTelegramViewportVars();
        WebApp.onEvent("viewportChanged", handleViewportChange);

        return () => {
            document.documentElement.classList.remove("tg-miniapp");
            WebApp.offEvent("viewportChanged", handleViewportChange);
        };
    }, []);
}
