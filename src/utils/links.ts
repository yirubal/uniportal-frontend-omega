import WebApp from "@twa-dev/sdk";

/** Opens a web link outside the Mini App (Telegram's in-app browser when available). */
export function openExternalLink(url: string) {
    if (WebApp.initData && WebApp.isVersionAtLeast?.("6.1")) {
        WebApp.openLink(url);
        return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
}
