import WebApp from "@twa-dev/sdk";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestDownload } from "../api/content";
import { getErrorMessage } from "../utils/errors";
import { haptic } from "../utils/haptics";

export interface DownloadMessage {
    tone: "success" | "error";
    text: string;
}

const isInsideTelegram = () => Boolean(WebApp.initData);

/** Hands a file URL to the best available download path for the current client. */
function deliverFile(url: string, fileName: string): Promise<"started" | "declined"> {
    // Telegram's native download sheet (Bot API 8.0+).
    if (isInsideTelegram() && WebApp.isVersionAtLeast?.("8.0")) {
        return new Promise((resolve) => {
            WebApp.downloadFile({ url, file_name: fileName }, (accepted) => resolve(accepted ? "started" : "declined"));
        });
    }

    // Older Telegram clients: open the file in the external browser (openLink exists since 6.1).
    if (isInsideTelegram() && WebApp.isVersionAtLeast?.("6.1")) {
        WebApp.openLink(url);
        return Promise.resolve("started");
    }

    // Plain browser (development).
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
    return Promise.resolve("started");
}

/**
 * Downloads a resource: requests a signed URL from the backend and hands it to Telegram.
 * Shared by the resource card and the detail screen so both get the same version gating and errors.
 */
export function useResourceDownload() {
    const navigate = useNavigate();
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState<DownloadMessage | null>(null);
    const inFlightRef = useRef(false);

    const download = useCallback(async (resourceId: number) => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setDownloading(true);
        setMessage(null);

        try {
            const response = await requestDownload(resourceId);
            const isWebUrl = /^https?:\/\//i.test(response.url);
            // Dev mocks return a data: URL; anything else that isn't http(s) is a broken link.
            if (!isWebUrl && !(import.meta.env.DEV && response.url.startsWith("data:"))) {
                setMessage({ tone: "error", text: "The download link is invalid. Please try again later." });
                return;
            }

            const result = await deliverFile(response.url, response.filename);
            if (result === "started") {
                haptic.success();
                setMessage({ tone: "success", text: `Downloading ${response.filename}` });
            }
        } catch (error) {
            if (typeof error === "object" && error !== null && "status" in error && error.status === 403) {
                navigate("/subscribe");
                return;
            }
            haptic.error();
            setMessage({ tone: "error", text: getErrorMessage(error, "Unable to prepare the download right now.") });
        } finally {
            inFlightRef.current = false;
            setDownloading(false);
        }
    }, [navigate]);

    return { download, downloading, message, clearMessage: () => setMessage(null) };
}
