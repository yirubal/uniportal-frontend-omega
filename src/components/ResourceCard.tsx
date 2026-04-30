import { Download, LoaderCircle, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWatermarkText } from "../api/auth";
import { requestDownload } from "../api/content";
import { useTelegram } from "../hooks/useTelegram";
import type { Resource } from "../store/contentStore";
import {
    formatDate,
    formatFileType,
    getFileTypeColor,
    getFileTypeIcon,
    truncate,
} from "../utils/format";

interface ResourceCardProps {
    resource: Resource;
    isLocked?: boolean;
}

export default function ResourceCard({
    resource,
    isLocked = false,
}: ResourceCardProps) {
    const navigate = useNavigate();
    const { downloadFile } = useTelegram();
    const [downloading, setDownloading] = useState(false);
    const colors = getFileTypeColor(resource.file_type);
    const icon = getFileTypeIcon(resource.file_type);

    const handleDownload = async () => {
        if (isLocked) {
            navigate("/subscribe");
            return;
        }

        if (downloading) return;

        setDownloading(true);
        try {
            const watermark = await getWatermarkText().catch(() => undefined);
            const response = await requestDownload(resource.id, watermark);
            if (response.url.startsWith("http")) {
                try {
                    downloadFile(response.url, response.filename);
                } catch {
                    window.open(response.url, "_blank", "noopener,noreferrer");
                }
            }
        } catch (error) {
            if (typeof error === "object" && error !== null && "status" in error && error.status === 403) {
                navigate("/subscribe");
            }
        } finally {
            setDownloading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={() => void handleDownload()}
            className="app-panel app-card-interactive relative flex w-full min-h-[9.25rem] cursor-pointer items-center gap-4 overflow-hidden rounded-[24px] px-5 py-6 text-left"
            style={{ paddingInline: "24px" }}
        >
            <div
                className="flex h-[3.25rem] w-[3.25rem] flex-shrink-0 items-center justify-center rounded-[16px] text-[1.35rem] "
                style={{ backgroundColor: colors.bg }}
            >
                {icon}
            </div>

            <div className="min-w-0 flex-1 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className="app-badge"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                        {formatFileType(resource.file_type)}
                    </span>
                    {isNewResource(resource.created_at) && (
                        <span className="app-badge app-badge-gold">
                            New
                        </span>
                    )}
                </div>

                <p className="mt-3 line-clamp-2 min-h-[2.8rem] pr-2 text-[0.97rem] font-semibold leading-snug text-[#172B2F]">
                    {truncate(resource.title, 52)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pr-2 text-[11px] font-medium text-[#72809a]">
                    <span>{formatDate(resource.created_at)}</span>
                    {resource.downloads_count > 0 && <span>{resource.downloads_count} downloads</span>}
                    <span>{resource.access_level === "premium" ? "Premium" : "Free"}</span>
                </div>
            </div>

            <div className={`mr-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${isLocked ? "bg-[rgba(245,229,226,0.96)] text-[#B75F57]" : "bg-[#172B2F] text-white"}`}>
                {downloading ? <LoaderCircle size={18} className="animate-spin" /> : isLocked ? <Lock size={18} /> : <Download size={18} />}
            </div>
        </button>
    );
}

function isNewResource(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
}
